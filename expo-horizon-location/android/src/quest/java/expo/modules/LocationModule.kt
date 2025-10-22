package expo.modules.location

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.GeomagneticField
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.location.LocationProvider
import android.os.Build
import android.os.Bundle
import android.os.Looper
import android.util.Log
import androidx.annotation.ChecksSdkIntAtLeast
import androidx.core.app.ActivityCompat
import androidx.core.location.LocationManagerCompat
import androidx.core.os.bundleOf
import expo.modules.core.interfaces.ActivityEventListener
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.location.records.GeocodeResponse
import expo.modules.location.records.GeofencingOptions
import expo.modules.location.records.Heading
import expo.modules.location.records.HeadingEventResponse
import expo.modules.location.records.LocationErrorEventResponse
import expo.modules.location.records.LocationLastKnownOptions
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationProviderStatus
import expo.modules.location.records.LocationResponse
import expo.modules.location.records.LocationTaskOptions
import expo.modules.location.records.PermissionDetailsLocationAndroid
import expo.modules.location.records.PermissionRequestResponse
import expo.modules.location.records.ReverseGeocodeLocation
import expo.modules.location.records.ReverseGeocodeResponse
import expo.modules.location.taskConsumers.GeofencingTaskConsumer
import expo.modules.location.taskConsumers.LocationTaskConsumer
import java.util.Locale
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine
import kotlin.math.abs

class LocationModule : Module(), LifecycleEventListener, ActivityEventListener {
  private var mGeofield: GeomagneticField? = null
  private val mLocationCallbacks = HashMap<Int, LocationListener>()
  private val mLocationRequests = HashMap<Int, LocationRequest>()
  private var mPendingLocationRequests = ArrayList<LocationActivityResultListener>()
  private lateinit var mContext: Context
  private lateinit var mUIManager: UIManager
  private lateinit var mLocationManager: LocationManager
  private lateinit var locationHelpers: LocationHelpers

  private var mGravity: FloatArray = FloatArray(9)
  private var mGeomagnetic: FloatArray = FloatArray(9)
  private var mHeadingId = 0
  private var mLastAzimuth = 0f
  private var mAccuracy = 0
  private var mLastUpdate: Long = 0
  private var mGeocoderPaused = false

  private val mTaskManager: TaskManagerInterface by lazy {
    return@lazy appContext.legacyModule<TaskManagerInterface>()
      ?: throw TaskManagerNotFoundException()
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoLocation")

    OnCreate {
      mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      mUIManager = appContext.legacyModule<UIManager>() ?: throw MissingUIManagerException()
      mLocationManager = mContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        ?: throw LocationManagerUnavailable()
      locationHelpers = LocationHelpers(mContext)
    }

    Constant("isHorizon") {
      VRUtilities.isHorizon()
    }

    Events(HEADING_EVENT_NAME, LOCATION_EVENT_NAME, LOCATION_ERROR_EVENT_NAME)

    // Deprecated
    AsyncFunction("requestPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      return@Coroutine if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        PermissionHelpers.askForPermissionsWithPermissionsManager(
          permissionsManager,
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION,
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      } else {
        PermissionHelpers.askForPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
      }
    }

    // Deprecated
    AsyncFunction("getPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      return@Coroutine if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q) {
        PermissionHelpers.getPermissionsWithPermissionsManager(
          permissionsManager,
          Manifest.permission.ACCESS_FINE_LOCATION,
          Manifest.permission.ACCESS_COARSE_LOCATION,
          Manifest.permission.ACCESS_BACKGROUND_LOCATION
        )
      } else {
        getForegroundPermissionsAsync()
      }
    }

    AsyncFunction("requestForegroundPermissionsAsync") Coroutine { ->
      val permissionsManager = appContext.permissions ?: throw NoPermissionsModuleException()

      PermissionHelpers.askForPermissionsWithPermissionsManager(permissionsManager, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
      // We aren't using the values returned above, because we need to check if the user has provided fine location permissions
      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("requestBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine requestBackgroundPermissionsAsync()
    }

    AsyncFunction("getForegroundPermissionsAsync") Coroutine { ->
      return@Coroutine getForegroundPermissionsAsync()
    }

    AsyncFunction("getBackgroundPermissionsAsync") Coroutine { ->
      return@Coroutine getBackgroundPermissionsAsync()
    }

    AsyncFunction("getLastKnownPositionAsync") Coroutine { options: LocationLastKnownOptions ->
      return@Coroutine getLastKnownPositionAsync(options)
    }

    AsyncFunction("getCurrentPositionAsync") { options: LocationOptions, promise: Promise ->
      return@AsyncFunction getCurrentPositionAsync(options, promise)
    }

    AsyncFunction<LocationProviderStatus>("getProviderStatusAsync") {
      return@AsyncFunction getProviderStatus()
    }

    AsyncFunction("watchDeviceHeading") { _: Int, promise: Promise ->
      if (VRUtilities.isHorizon()) {
        promise.reject(QuestFeatureUnavailableException())
        return@AsyncFunction
      }
      promise.reject(QuestPrebuildEnvironmentException())
      return@AsyncFunction
    }

    AsyncFunction("watchPositionImplAsync") { watchId: Int, options: LocationOptions, promise: Promise ->
      // Check for permissions
      if (isMissingForegroundPermissions()) {
        promise.reject(LocationUnauthorizedException())
        return@AsyncFunction
      }

      val locationRequest = LocationHelpers.prepareLocationRequest(options)
      val showUserSettingsDialog = options.mayShowUserSettingsDialog

      if (SharedHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
        locationHelpers.requestContinuousUpdates(this@LocationModule, locationRequest, watchId, promise)
      } else {
        // Pending requests can ask the user to turn on improved accuracy mode in user's settings.
        addPendingLocationRequest(
          locationRequest,
          object : LocationActivityResultListener {
            override fun onResult(resultCode: Int) {
              if (resultCode == Activity.RESULT_OK) {
                locationHelpers.requestContinuousUpdates(this@LocationModule, locationRequest, watchId, promise)
              } else {
                promise.reject(LocationSettingsUnsatisfiedException())
              }
            }
          }
        )
      }
    }

    AsyncFunction("removeWatchAsync") { watchId: Int ->
      if (isMissingForegroundPermissions()) {
        throw LocationUnauthorizedException()
      }

      // Check if we want to stop watching location or compass
      if (watchId == mHeadingId) {
        throw QuestFeatureUnavailableException()
      } else {
        removeLocationUpdatesForRequest(watchId)
      }
    }

    AsyncFunction("geocodeAsync") Coroutine { address: String ->
      return@Coroutine geocode(address)
    }

    AsyncFunction("reverseGeocodeAsync") Coroutine { location: ReverseGeocodeLocation ->
      return@Coroutine reverseGeocode(location)
    }

    AsyncFunction("enableNetworkProviderAsync") Coroutine { ->
      if (SharedHelpers.hasNetworkProviderEnabled(mContext)) {
        return@Coroutine null
      }

      val locationRequest = LocationHelpers.prepareLocationRequest(LocationOptions())

      return@Coroutine suspendCoroutine<String?> { continuation ->
        addPendingLocationRequest(
          locationRequest,
          object : LocationActivityResultListener {
            override fun onResult(resultCode: Int) {
              if (resultCode == Activity.RESULT_OK) {
                continuation.resume(null)
              } else {
                continuation.resumeWithException(LocationSettingsUnsatisfiedException())
              }
            }
          }
        )
      }
    }

    AsyncFunction<Boolean>("hasServicesEnabledAsync") {
      return@AsyncFunction LocationHelpers.isAnyProviderAvailable(mContext)
    }

    AsyncFunction("startLocationUpdatesAsync") { taskName: String, options: LocationTaskOptions ->
      val shouldUseForegroundService = options.foregroundService != null

      if (isMissingForegroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }
      // There are two ways of starting this service.
      // 1. As a background location service, this requires the background location permission.
      // 2. As a user-initiated foreground service with notification, this does NOT require the background location permission.
      if (!shouldUseForegroundService && isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }
      if (!AppForegroundedSingleton.isForegrounded && options.foregroundService != null) {
        throw ForegroundServiceStartNotAllowedException()
      }

      if (!hasForegroundServicePermissions()) {
        throw ForegroundServicePermissionsException()
      }

      mTaskManager.registerTask(taskName, LocationTaskConsumer::class.java, options.toMutableMap())
      return@AsyncFunction
    }

    AsyncFunction("stopLocationUpdatesAsync") { taskName: String ->
      mTaskManager.unregisterTask(taskName, LocationTaskConsumer::class.java)
      return@AsyncFunction
    }

    AsyncFunction("hasStartedLocationUpdatesAsync") { taskName: String ->
      return@AsyncFunction mTaskManager.taskHasConsumerOfClass(taskName, LocationTaskConsumer::class.java)
    }

    AsyncFunction("startGeofencingAsync") { taskName: String, options: GeofencingOptions ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      mTaskManager.registerTask(taskName, GeofencingTaskConsumer::class.java, options.toMap())
      return@AsyncFunction
    }

    AsyncFunction("hasStartedGeofencingAsync") { taskName: String ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      return@AsyncFunction mTaskManager.taskHasConsumerOfClass(taskName, GeofencingTaskConsumer::class.java)
    }

    AsyncFunction("stopGeofencingAsync") { taskName: String ->
      if (isMissingBackgroundPermissions()) {
        throw LocationBackgroundUnauthorizedException()
      }

      mTaskManager.unregisterTask(taskName, GeofencingTaskConsumer::class.java)
      return@AsyncFunction
    }

    OnActivityEntersForeground {
      AppForegroundedSingleton.isForegrounded = true
    }

    OnActivityEntersBackground {
      AppForegroundedSingleton.isForegrounded = false
    }
  }

  private suspend fun getForegroundPermissionsAsync(): PermissionRequestResponse {
    appContext.permissions?.let {
      val locationPermission = PermissionHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_COARSE_LOCATION)
      val fineLocationPermission = PermissionHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_FINE_LOCATION)

      var accuracy = "none"
      if (locationPermission.granted) {
        accuracy = "coarse"
      }
      if (fineLocationPermission.granted) {
        accuracy = "fine"
      }

      locationPermission.android = PermissionDetailsLocationAndroid(
        accuracy = accuracy
      )

      return locationPermission
    } ?: throw NoPermissionsModuleException()
  }

  private fun getProviderStatus(): LocationProviderStatus {
    val manager = mContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager

    val isGpsAvailable = manager.isProviderEnabled(LocationManager.GPS_PROVIDER)
    val isNetworkAvailable = manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    val isLocationServicesEnabled = LocationManagerCompat.isLocationEnabled(manager)
    val isPassiveAvailable = manager.isProviderEnabled(LocationManager.PASSIVE_PROVIDER)

    return LocationProviderStatus().apply {
      backgroundModeEnabled = isLocationServicesEnabled
      gpsAvailable = isGpsAvailable
      networkAvailable = isNetworkAvailable
      locationServicesEnabled = isLocationServicesEnabled
      passiveAvailable = isPassiveAvailable
    }
  }

  private suspend fun requestBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    if (!shouldAskBackgroundPermissions()) {
      return getForegroundPermissionsAsync()
    }
    return appContext.permissions?.let {
      val permissionResponseBundle = PermissionHelpers.askForPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      PermissionRequestResponse(permissionResponseBundle)
    } ?: throw NoPermissionsModuleException()
  }

  private suspend fun getBackgroundPermissionsAsync(): PermissionRequestResponse {
    if (!isBackgroundPermissionInManifest()) {
      throw NoPermissionInManifestException("ACCESS_BACKGROUND_LOCATION")
    }
    if (!shouldAskBackgroundPermissions()) {
      return getForegroundPermissionsAsync()
    }
    appContext.permissions?.let {
      return PermissionHelpers.getPermissionsWithPermissionsManager(it, Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    } ?: throw NoPermissionsModuleException()
  }

  /**
   * Resolves to the last known position if it is available and matches given requirements or null otherwise.
   */
  private suspend fun getLastKnownPositionAsync(options: LocationLastKnownOptions): LocationResponse? {
    // Check for permissions
    if (isMissingForegroundPermissions()) {
      throw LocationUnauthorizedException()
    }
    val lastKnownLocation = getLastKnownLocation() ?: return null

    if (SharedHelpers.isLocationValid(lastKnownLocation, options)) {
      return LocationResponse(lastKnownLocation)
    }
    return null
  }

  /**
   * Requests for the current position. Depending on given accuracy, it may take some time to resolve.
   * If you don't need an up-to-date location see `getLastKnownPosition`.
   */
  private fun getCurrentPositionAsync(options: LocationOptions, promise: Promise) {
    // Read options
    val locationRequest = LocationHelpers.prepareLocationRequest(options)
    val currentLocationRequest = LocationHelpers.prepareCurrentLocationRequest(options)
    val showUserSettingsDialog = options.mayShowUserSettingsDialog

    // Check for permissions
    if (isMissingForegroundPermissions()) {
      promise.reject(LocationUnauthorizedException())
      return
    }
    if (SharedHelpers.hasNetworkProviderEnabled(mContext) || !showUserSettingsDialog) {
      locationHelpers.requestSingleLocation(currentLocationRequest, promise)
    } else {
      addPendingLocationRequest(
        locationRequest,
        object : LocationActivityResultListener {
          override fun onResult(resultCode: Int) {
            if (resultCode == Activity.RESULT_OK) {
              locationHelpers.requestSingleLocation(currentLocationRequest, promise)
            } else {
              promise.reject(LocationSettingsUnsatisfiedException())
            }
          }
        }
      )
    }
  }

  fun requestLocationUpdates(locationRequest: LocationRequest, requestId: Int?, callbacks: LocationRequestCallbacks) {
    val locationManager: LocationManager = mLocationManager

    val locationListener: LocationListener = object : LocationListener {
      override fun onLocationChanged(location: Location) {
        callbacks.onLocationChanged(location)
      }

      override fun onProviderEnabled(provider: String) {
        // Provider enabled
      }

      override fun onProviderDisabled(provider: String) {
        callbacks.onLocationError(LocationUnavailableException())
      }

      override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {
        when (status) {
          LocationProvider.AVAILABLE -> {
            // Provider is available
          }

          LocationProvider.TEMPORARILY_UNAVAILABLE -> {
            callbacks.onLocationError(LocationUnavailableException())
          }

          LocationProvider.OUT_OF_SERVICE -> {
            callbacks.onLocationError(LocationUnavailableException())
          }
        }
      }
    }

    if (requestId != null) {
      // Save location callback and request so we will be able to pause/resume receiving updates.
      mLocationCallbacks[requestId] = locationListener
      mLocationRequests[requestId] = locationRequest
    }

    try {
      val provider = LocationHelpers.mapPriorityToProvider(locationRequest.priority)

      if (!locationManager.isProviderEnabled(provider)) {
        callbacks.onRequestFailed(LocationUnavailableException())
        return
      }

      locationManager.requestLocationUpdates(
        provider,
        locationRequest.minUpdateIntervalMillis,
        locationRequest.minUpdateDistanceMeters,
        locationListener,
        Looper.getMainLooper()
      )
      callbacks.onRequestSuccess()
    } catch (e: SecurityException) {
      callbacks.onRequestFailed(LocationRequestRejectedException(e))
    }
  }

  private fun addPendingLocationRequest(locationRequest: LocationRequest, listener: LocationActivityResultListener) {
    // Add activity result listener to an array of pending requests.
    mPendingLocationRequests.add(listener)

    // If it's the first pending request, let's ask the user to turn on high accuracy location.
    if (mPendingLocationRequests.size == 1) {
      resolveUserSettingsForRequest(locationRequest)
    }
  }

  /**
   * Checks if location services are enabled and executes pending requests accordingly.
   */
  private fun resolveUserSettingsForRequest(locationRequest: LocationRequest) {
    val provider = when (locationRequest.priority) {
      LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> LocationManager.GPS_PROVIDER
      LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> LocationManager.NETWORK_PROVIDER
      LocationModule.ACCURACY_LOWEST -> LocationManager.PASSIVE_PROVIDER
      else -> LocationManager.GPS_PROVIDER
    }

    if (mLocationManager.isProviderEnabled(provider)) {
      // Location services are enabled
      executePendingRequests(Activity.RESULT_OK)
    } else {
      // Location services are not enabled, we can't fix this automatically
      executePendingRequests(Activity.RESULT_CANCELED)
    }
  }

  private fun executePendingRequests(resultCode: Int) {
    // Propagate result to pending location requests.
    for (listener in mPendingLocationRequests) {
      listener.onResult(resultCode)
    }
    mPendingLocationRequests.clear()
  }

  internal fun sendLocationResponse(watchId: Int, response: LocationResponse) {
    val responseBundle = bundleOf()
    responseBundle.putBundle("location", response.toBundle(Bundle::class.java))
    responseBundle.putInt("watchId", watchId)
    sendEvent(LOCATION_EVENT_NAME, responseBundle)
  }

  private fun startWatching() {
    // Resume paused location updates
    resumeLocationUpdates()
  }

  private fun stopWatching() {
    for (requestId in mLocationCallbacks.keys) {
      pauseLocationUpdatesForRequest(requestId)
    }
  }

  private fun pauseLocationUpdatesForRequest(requestId: Int) {
    // For LocationManager, we can't easily pause individual location listeners
    // The system will handle cleanup when the service is destroyed
    // This is a limitation of using LocationManager instead of FusedLocationProviderClient
  }

  private fun removeLocationUpdatesForRequest(requestId: Int) {
    pauseLocationUpdatesForRequest(requestId)
    mLocationCallbacks.remove(requestId)
    mLocationRequests.remove(requestId)
  }

  private fun resumeLocationUpdates() {
    // For LocationManager, we can't easily resume individual location listeners
    // The system will handle cleanup when the service is destroyed
    // This is a limitation of using LocationManager instead of FusedLocationProviderClient
    for (requestId in mLocationCallbacks.keys) {
      val locationListener = mLocationCallbacks[requestId] ?: return
      val locationRequest = mLocationRequests[requestId] ?: return
      try {
        val provider = LocationHelpers.mapPriorityToProvider(locationRequest.priority)

        if (mLocationManager.isProviderEnabled(provider)) {
          mLocationManager.requestLocationUpdates(
            provider,
            locationRequest.minUpdateIntervalMillis,
            locationRequest.minUpdateDistanceMeters,
            locationListener,
            Looper.getMainLooper()
          )
        }
      } catch (e: SecurityException) {
        Log.e(TAG, "Error occurred while resuming location updates: $e")
      }
    }
  }

  /**
   * Gets the best most recent location found by the provider.
   */
  private suspend fun getLastKnownLocation(): Location? {
    return suspendCoroutine { continuation ->
      try {
        val provider = if (VRUtilities.isHorizon()) LocationManager.NETWORK_PROVIDER else LocationManager.GPS_PROVIDER
        if (mLocationManager.isProviderEnabled(provider)) {
          val location = mLocationManager.getLastKnownLocation(provider)
          continuation.resume(location)
        } else {
          continuation.resume(null)
        }
      } catch (e: SecurityException) {
        continuation.resume(null)
      }
    }
  }

  private suspend fun geocode(address: String): List<GeocodeResponse> {
    if (VRUtilities.isHorizon()) {
      throw QuestFeatureUnavailableException()
    }
    throw QuestPrebuildEnvironmentException()
  }

  private suspend fun reverseGeocode(location: ReverseGeocodeLocation): List<ReverseGeocodeResponse> {
    if (VRUtilities.isHorizon()) {
      throw QuestFeatureUnavailableException()
    }
    throw QuestPrebuildEnvironmentException()
  }

  //region private methods
  /**
   * Checks whether all required permissions have been granted by the user.
   */
  private fun isMissingForegroundPermissions(): Boolean {
    appContext.permissions?.let {
      val canAccessFineLocation = it.hasGrantedPermissions(Manifest.permission.ACCESS_FINE_LOCATION)
      val canAccessCoarseLocation = it.hasGrantedPermissions(Manifest.permission.ACCESS_COARSE_LOCATION)
      return !canAccessFineLocation && !canAccessCoarseLocation
    } ?: throw Exceptions.AppContextLost()
  }

  private fun hasForegroundServicePermissions(): Boolean {
    appContext.permissions?.let {
      return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        val canAccessForegroundServiceLocation = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE_LOCATION)
        val canAccessForegroundService = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE)
        canAccessForegroundService && canAccessForegroundServiceLocation
      } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        val canAccessForegroundService = it.hasGrantedPermissions(Manifest.permission.FOREGROUND_SERVICE)
        canAccessForegroundService
      } else {
        true
      }
    } ?: throw Exceptions.AppContextLost()
  }

  /**
   * Checks if the background location permission is granted by the user.
   */
  private fun isMissingBackgroundPermissions(): Boolean {
    appContext.permissions?.let {
      return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && !it.hasGrantedPermissions(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    return true
  }

  /**
   * Check if we need to request background location permission separately.
   *
   * @see `https://medium.com/swlh/request-location-permission-correctly-in-android-11-61afe95a11ad`
   */
  @ChecksSdkIntAtLeast(api = Build.VERSION_CODES.Q)
  private fun shouldAskBackgroundPermissions(): Boolean {
    return Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q
  }

  private fun isBackgroundPermissionInManifest(): Boolean {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appContext.permissions?.let {
        return it.isPermissionPresentInManifest(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
      }
      throw NoPermissionsModuleException()
    } else {
      true
    }
  }

  /**
   * Helper method that lazy-loads the location provider for the context that the module was created.
   */

  companion object {
    internal val TAG = LocationModule::class.java.simpleName
    private const val LOCATION_EVENT_NAME = "Expo.locationChanged"
    private const val HEADING_EVENT_NAME = "Expo.headingChanged"
    private const val LOCATION_ERROR_EVENT_NAME = "Expo.locationError"
    private const val CHECK_SETTINGS_REQUEST_CODE = 42

    const val ACCURACY_LOWEST = 1
    const val ACCURACY_LOW = 2
    const val ACCURACY_BALANCED = 3
    const val ACCURACY_HIGH = 4
    const val ACCURACY_HIGHEST = 5
    const val ACCURACY_BEST_FOR_NAVIGATION = 6

    const val GEOFENCING_EVENT_ENTER = 1
    const val GEOFENCING_EVENT_EXIT = 2
  }

  override fun onHostResume() {
    startWatching()
  }

  override fun onHostPause() {
    stopWatching()
  }

  override fun onHostDestroy() {
    stopWatching()
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != CHECK_SETTINGS_REQUEST_CODE) {
      return
    }
    executePendingRequests(resultCode)
    mUIManager.unregisterActivityEventListener(this)
  }

  override fun onNewIntent(intent: Intent?) {}
}
