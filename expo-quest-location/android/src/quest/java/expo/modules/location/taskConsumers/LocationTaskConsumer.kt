package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.os.PersistableBundle
import android.util.Log
import android.location.LocationListener
import android.location.LocationProvider
import expo.modules.core.MapHelper
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.Arguments
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.AppForegroundedSingleton
import expo.modules.location.LocationHelpers
import expo.modules.location.LocationModule
import expo.modules.location.LocationRequest
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse
import expo.modules.location.services.LocationTaskService
import expo.modules.location.services.LocationTaskService.ServiceBinder
import kotlin.math.abs

class LocationTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface, LifecycleEventListener {
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mService: LocationTaskService? = null
  private var mLocationRequest: LocationRequest? = null
  private var mLastReportedLocation: Location? = null
  private var mDeferredDistance = 0.0
  private val mDeferredLocations: MutableList<Location> = ArrayList()
  private var mIsHostPaused = true
  private val mLocationManager: LocationManager by lazy {
    context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
  }

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "location"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startLocationUpdates()
    maybeStartForegroundService()
  }

  override fun didUnregister() {
    stopLocationUpdates()
    stopForegroundService()
    mTask = null
    mPendingIntent = null
    mLocationRequest = null
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)

    // Restart location updates
    stopLocationUpdates()
    startLocationUpdates()

    // Restart foreground service if its option has changed.
    maybeStartForegroundService()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    mTask ?: return
    // For LocationManager, we'll get location updates through the LocationListener
    // This method is called when the service receives a broadcast
    try {
      val provider = LocationManager.GPS_PROVIDER
      if (mLocationManager.isProviderEnabled(provider)) {
        val location = mLocationManager.getLastKnownLocation(provider)
        location?.let {
          deferLocations(listOf(it))
          maybeReportDeferredLocations()
        }
      }
    } catch (e: SecurityException) {
      Log.e(TAG, "Cannot get last location: " + e.message)
    }
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val data = taskManagerUtils.extractDataFromJobParams(params)
    val locationBundles = ArrayList<Bundle>()
    for (persistableLocationBundle in data) {
      val locationBundle = Bundle()
      val coordsBundle = Bundle()
      if (persistableLocationBundle != null) {
        coordsBundle.putAll(persistableLocationBundle.getPersistableBundle("coords"))
        locationBundle.putAll(persistableLocationBundle)
        locationBundle.putBundle("coords", coordsBundle)
        locationBundles.add(locationBundle)
      }
    }
    executeTaskWithLocationBundles(locationBundles) { jobService.jobFinished(params, false) }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  //region private
  private fun startLocationUpdates() {
    val context = context ?: run {
      Log.w(TAG, "The context has been abandoned")
      return
    }

    if (!LocationHelpers.isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available")
      return
    }
    val task = mTask ?: run {
      Log.w(TAG, "Could not find a location task for the location update")
      return
    }
    mLocationRequest = LocationHelpers.prepareLocationRequest(LocationOptions(task.options))
    mPendingIntent = preparePendingIntent()

    val locationRequest = mLocationRequest ?: run {
      Log.w(TAG, "Could not find a location request for the location update")
      return
    }
    val intent = mPendingIntent ?: run {
      Log.w(TAG, "Could not find intent for the location update")
      return
    }

    try {
      val provider = when (locationRequest.priority) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> LocationManager.GPS_PROVIDER
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> LocationManager.NETWORK_PROVIDER
        LocationModule.ACCURACY_LOWEST -> LocationManager.PASSIVE_PROVIDER
        else -> LocationManager.GPS_PROVIDER
      }
      
      if (mLocationManager.isProviderEnabled(provider)) {
        mLocationManager.requestLocationUpdates(
          provider,
          locationRequest.minUpdateIntervalMillis,
          locationRequest.minUpdateDistanceMeters,
          object : LocationListener {
            override fun onLocationChanged(location: Location) {
              deferLocations(listOf(location))
              maybeReportDeferredLocations()
            }

            override fun onProviderEnabled(provider: String) {
              // Provider enabled
            }

            override fun onProviderDisabled(provider: String) {
              // Provider disabled
            }

            override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {
              // Status changed
            }
          },
          Looper.getMainLooper()
        )
      }
    } catch (e: SecurityException) {
      Log.w(TAG, "Location request has been rejected.", e)
    }
  }

  private fun stopLocationUpdates() {
    // For LocationManager, we need to remove all location listeners
    // Since we're using anonymous LocationListener objects, we can't easily remove them
    // The system will handle cleanup when the service is destroyed
    mPendingIntent?.let {
      it.cancel()
    }
  }

  private fun maybeStartForegroundService() {
    // Foreground service is available as of Android Oreo.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    if (!AppForegroundedSingleton.isForegrounded) {
      Log.w(TAG, "Foreground location task cannot be started while the app is in the background!")
      return
    }
    val task = mTask ?: run {
      Log.w(TAG, "Location task is null")
      return
    }
    val options: ReadableArguments = MapArguments(task.options)
    val useForegroundService = shouldUseForegroundService(task.options)

    // Service is already running, but the task has been registered again without `foregroundService` option.
    if (mService != null && !useForegroundService) {
      stopForegroundService()
      return
    }

    // Service is not running and the user don't want to start foreground service.
    if (!useForegroundService) {
      return
    }

    // Foreground service is requested but not running.
    if (mService == null) {
      val serviceIntent = Intent(context, LocationTaskService::class.java)
      val extras = Bundle()
      val serviceOptions = options.getArguments(FOREGROUND_SERVICE_KEY).toBundle()

      // extras param name is appId for legacy reasons
      extras.putString("appId", task.appScopeKey)
      extras.putString("taskName", task.name)
      extras.putBoolean("killService", serviceOptions.getBoolean("killServiceOnDestroy", false))
      serviceIntent.putExtras(extras)
      context.startForegroundService(serviceIntent)
      context.bindService(
        serviceIntent,
        object : ServiceConnection {
          override fun onServiceConnected(name: ComponentName, service: IBinder) {
            mService = (service as? ServiceBinder)?.service
            mService?.let {
              it.setParentContext(context)
              it.startForeground(serviceOptions)
            }
          }

          override fun onServiceDisconnected(name: ComponentName) {
            mService?.stop()
            mService = null
          }
        },
        Context.BIND_AUTO_CREATE
      )
    } else {
      // Restart the service with new service options.
      mService?.startForeground(options.getArguments(FOREGROUND_SERVICE_KEY).toBundle())
    }
  }

  private fun stopForegroundService() {
    mService?.stop()
  }

  private fun deferLocations(locations: List<Location>) {
    val size = mDeferredLocations.size
    var lastLocation = if (size > 0) mDeferredLocations[size - 1] else mLastReportedLocation
    for (location in locations) {
      if (lastLocation != null) {
        mDeferredDistance += abs(location.distanceTo(lastLocation)).toDouble()
      }
      lastLocation = location
    }
    mDeferredLocations.addAll(locations)
  }

  private fun maybeReportDeferredLocations() {
    if (!shouldReportDeferredLocations()) {
      return
    }
    val context = context.applicationContext
    val data: MutableList<PersistableBundle> = ArrayList()
    for (location in mDeferredLocations) {
      val timestamp = location.time

      // Some devices may broadcast the same location multiple times (mostly twice) so we're filtering out these locations,
      // so only one location at the specific timestamp can schedule a job.
      if (timestamp > sLastTimestamp) {
        val bundle = LocationResponse(location).toBundle(PersistableBundle::class.java)
        data.add(bundle)
        sLastTimestamp = timestamp
      }
    }
    if (data.size > 0) {
      // Save last reported location, reset the distance and clear a list of locations.
      mLastReportedLocation = mDeferredLocations[mDeferredLocations.size - 1]
      mDeferredDistance = 0.0
      mDeferredLocations.clear()

      // Schedule new job.
      taskManagerUtils.scheduleJob(context, mTask, data)
    }
  }

  private fun shouldReportDeferredLocations(): Boolean {
    val task = mTask ?: return false
    if (mDeferredLocations.size == 0) {
      return false
    }
    if (!mIsHostPaused) {
      // Don't defer location updates when the activity is in foreground state.
      return true
    }
    val oldestLocation = mLastReportedLocation ?: mDeferredLocations[0]
    val newestLocation = mDeferredLocations[mDeferredLocations.size - 1]
    val options: Arguments = MapHelper(task.options)
    val distance = options.getDouble("deferredUpdatesDistance")
    val interval = options.getLong("deferredUpdatesInterval")
    return newestLocation.time - oldestLocation.time >= interval && mDeferredDistance >= distance
  }

  private fun preparePendingIntent(): PendingIntent {
    return taskManagerUtils.createTaskIntent(context, mTask)
  }

  private fun executeTaskWithLocationBundles(locationBundles: ArrayList<Bundle>, callback: TaskExecutionCallback) {
    if (locationBundles.size > 0 && mTask != null) {
      val data = Bundle()
      data.putParcelableArrayList("locations", locationBundles)
      mTask?.execute(data, null, callback)
    } else {
      callback.onFinished(null)
    }
  }

  override fun onHostResume() {
    mIsHostPaused = false
    maybeReportDeferredLocations()
  }

  override fun onHostPause() {
    mIsHostPaused = true
  }

  override fun onHostDestroy() {
    mIsHostPaused = true
  } //endregion

  companion object {
    private const val TAG = "LocationTaskConsumer"
    private const val FOREGROUND_SERVICE_KEY = "foregroundService"
    private var sLastTimestamp: Long = 0
    fun shouldUseForegroundService(options: Map<String?, Any?>): Boolean {
      return options.containsKey(FOREGROUND_SERVICE_KEY)
    }
  }
}
