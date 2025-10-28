package expo.modules.notifications.tokens

import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.BuildConfig
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate.Companion.addTokenListener
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener
import horizon.core.android.driver.coroutines.HorizonServiceConnection
import horizon.platform.pushnotification.PushNotification
import horizon.platform.pushnotification.models.PushNotificationResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

private const val NEW_TOKEN_EVENT_NAME = "onDevicePushToken"
private const val NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken"
private const val REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED"
private const val UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE = "E_UNREGISTER_FOR_NOTIFICATIONS_FAILED"

class PushTokenModule : Module(), FirebaseTokenListener {
  private companion object {
    private const val APP_ID = BuildConfig.META_QUEST_APP_ID

    private const val TAG = "expo-quest-notifications"
  }

  /**
   * Callback called when [FirebaseMessagingDelegate] gets notified of a new token.
   * Emits a [NEW_TOKEN_EVENT_NAME] event.
   *
   * @param token New push token.
   */
  override fun onNewToken(token: String) {
    sendEvent(
      NEW_TOKEN_EVENT_NAME,
      mapOf(
        NEW_TOKEN_EVENT_TOKEN_KEY to token
      )
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoPushTokenManager")

    Events("onDevicePushToken")

    OnCreate {
      addTokenListener(this@PushTokenModule)
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      try {
        Log.i(TAG, "Connecting to Horizon Service with APP_ID=$APP_ID")
        HorizonServiceConnection.connect(APP_ID, context)
        Log.i(TAG, "Successfully connected to Horizon Service!")
      } catch (e: Exception) {
        Log.e(TAG, "Failed to connect to Horizon Service", e)
      }
    }

    /**
     * Fetches push token from Horizon platform and resolves the promise.
     *
     * @param promise Promise to be resolved with the token.
     */
    AsyncFunction("getDevicePushTokenAsync") { promise: Promise ->
      CoroutineScope(Dispatchers.IO).launch {
        try {
          val pushNotification = PushNotification()
          val result: PushNotificationResult = pushNotification.register()

          val token = result.id
          if (token.isNullOrEmpty()) {
            promise.reject(REGISTRATION_FAIL_CODE, "Received empty token from Horizon platform", null)
          } else {
            promise.resolve(token)
            onNewToken(token)
          }
        } catch (e: Exception) {
          promise.reject(REGISTRATION_FAIL_CODE, "Failed to register for push notifications: ${e.message ?: "unknown error"}", e)
        }
      }
    }

    AsyncFunction("unregisterForNotificationsAsync") { promise: Promise ->
      // TODO: Implement proper unregistration when Horizon platform provides an API for it
      // For now, we can only report that unregistration is not supported
      promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Unregistration is not currently supported on Horizon platform", null)
    }
  }
}
