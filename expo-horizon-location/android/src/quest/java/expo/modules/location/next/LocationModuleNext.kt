package expo.modules.location.next

import android.content.Context
import android.location.LocationManager
import androidx.core.location.LocationManagerCompat
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import expo.modules.location.QuestFeatureUnavailableException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.sharedobjects.SharedRef
import expo.modules.location.next.locationProviders.AndroidLocationProvider
import expo.modules.location.next.locationProviders.EnableLocationServicesResult
import expo.modules.location.next.locationProviders.FallbackLocationProvider
import expo.modules.location.next.locationProviders.LocationProvider
import kotlinx.coroutines.CompletableDeferred
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.PositionUpdatesSession
import java.lang.ref.WeakReference
import kotlin.time.Duration

class LocationModuleNext : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw NoPermissionsModuleException()

  val watchSessions: MutableList<WeakReference<PausableWatchSession>> = mutableListOf()
  val androidLocationProviderInstance: SharedRef<LocationProvider> by lazy {
    SharedRef(AndroidLocationProvider(context))
  }

  lateinit var currentLocationProvider: LocationProvider

  lateinit var locationManager: LocationManager

  @Volatile
  private var locationServicesPrompt: CompletableDeferred<Boolean>? = null

  fun createPositionWatchHandle(initialParameters: WatchPositionParameters, session: PositionUpdatesSession): PositionWatchHandle = synchronized(watchSessions) {
    val pausableSession = PausableWatchSession(initialParameters, session)
    watchSessions.add(WeakReference(pausableSession))
    return@synchronized PositionWatchHandle(pausableSession)
  }

  override fun definition() = ModuleDefinition {
    Name("LocationModuleNext")

    OnCreate {
      currentLocationProvider = androidLocationProviderInstance.ref
      locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    }

    // Permissions
    AsyncFunction("requestForegroundPermissions") Coroutine { options: RequestForegroundPermissionsOptions? ->
      permissionsManager.requestForegroundPermissions(options)
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("getForegroundPermissions") Coroutine { ->
      return@Coroutine permissionsManager.getLocationPermissions(background = false)
    }

    AsyncFunction("requestBackgroundPermissions") Coroutine { ->
      return@Coroutine unsupportedBackgroundPermissions()
    }

    AsyncFunction("getBackgroundPermissions") Coroutine { ->
      return@Coroutine unsupportedBackgroundPermissions()
    }

    // Location providers
    Function("setLocationProvider") { locationProvider: SharedRef<LocationProvider> ->
      currentLocationProvider = locationProvider.ref
    }

    Function("getSelectedLocationProviderName") {
      currentLocationProvider.name
    }

    Class("LocationProvider") {
      StaticFunction("Gms") { ->
        unsupportedGmsProvider()
      }
      StaticFunction("Android") { ->
        androidLocationProviderInstance
      }
      StaticFunction("Fallback") { providers: List<SharedRef<LocationProvider>> ->
        SharedRef(FallbackLocationProvider(providers.map { it.ref }))
      }
    }

    AsyncFunction("getPosition") Coroutine { options: GetPositionOptions? ->
      permissionsManager.ensureForegroundPermissions()
      val providerOptions = (options ?: GetPositionOptions()).toProviderOptions()
      return@Coroutine currentLocationProvider.getPosition(providerOptions).getOrNull("getPosition")
    }

    Function("watchPosition") { profile: LocationProfile? ->
      permissionsManager.ensureForegroundPermissions()
      val parameters = (profile ?: LocationProfile.DEFAULT).watchParameters()
      return@Function createPositionWatchHandle(parameters, currentLocationProvider.watchPosition().getOrThrow("watchPosition"))
    }

    Function("hasLocationServicesEnabled") { ->
      hasLocationServicesEnabled()
    }

    AsyncFunction("enableLocationServices") Coroutine { ->
      if (hasLocationServicesEnabled()) {
        return@Coroutine true
      }
      locationServicesPrompt?.let {
        return@Coroutine it.await()
      }

      val promptResult = CompletableDeferred<Boolean>()
      locationServicesPrompt = promptResult
      try {
        val enableServicesResult = currentLocationProvider
          .enableLocationServices(appContext.throwingActivity)
          .getOrThrow("enableLocationServices")

        when (enableServicesResult) {
          is EnableLocationServicesResult.Disabled -> promptResult.complete(false)
          is EnableLocationServicesResult.Enabled -> promptResult.complete(true)
          is EnableLocationServicesResult.ResolutionPending -> {}
        }

        return@Coroutine promptResult.await()
      } catch (cause: Throwable) {
        promptResult.completeExceptionally(cause)
        throw cause
      } finally {
        locationServicesPrompt = null
      }
    }

    OnActivityResult { _, payload ->
      if (payload.requestCode == SETTINGS_REQUEST_CODE) {
        locationServicesPrompt?.complete(hasLocationServicesEnabled())
      }
    }

    Class(PositionWatchHandle::class) {
      Constructor {
        throw PositionWatchHandleCreationException()
      }

      Events(POSITION_CHANGED)

      Function("pause") { locationWatchHandle: PositionWatchHandle ->
        locationWatchHandle.session.pause()
      }

      Function("resume") { locationWatchHandle: PositionWatchHandle ->
        return@Function locationWatchHandle.session.resume()
      }

      Function("withProfile") { locationWatchHandle: PositionWatchHandle, profile: LocationProfile ->
        locationWatchHandle.session.withProfile(profile)
        locationWatchHandle
      }

      Function("withInterval") { locationWatchHandle: PositionWatchHandle, interval: Duration ->
        if (interval < Duration.ZERO || interval == Duration.INFINITE) {
          throw InvalidWatchIntervalException(interval)
        }
        locationWatchHandle.session.withInterval(interval)
        locationWatchHandle
      }

      Function("restart") { locationWatchHandle: PositionWatchHandle ->
        return@Function locationWatchHandle.session.restart()
      }

      Function("status") { locationWatchHandle: PositionWatchHandle ->
        locationWatchHandle.session.status()
      }
    }

    OnDestroy {
      synchronized(watchSessions) {
        for (session in watchSessions) {
          session.get()?.release()
        }
      }
    }

    OnActivityEntersForeground {
      synchronized(watchSessions) {
        for (session in watchSessions) {
          session.get()?.onLifecycleChange(true)
        }
      }
    }

    OnActivityEntersBackground {
      synchronized(watchSessions) {
        watchSessions.removeIf { it.get() == null }
        for (session in watchSessions) {
          session.get()?.onLifecycleChange(false)
        }
      }
    }
  }

  // Keep the upstream API surface while rejecting capabilities unavailable on Horizon.
  private fun unsupportedBackgroundPermissions(): LocationPermissionResponse =
    throw QuestFeatureUnavailableException()

  private fun unsupportedGmsProvider(): SharedRef<LocationProvider> =
    throw QuestFeatureUnavailableException()

  private fun hasLocationServicesEnabled(): Boolean {
    return LocationManagerCompat.isLocationEnabled(locationManager)
  }
}
