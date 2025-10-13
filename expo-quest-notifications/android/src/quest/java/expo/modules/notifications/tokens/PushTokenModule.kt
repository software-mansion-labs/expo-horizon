package expo.modules.notifications.tokens

import com.meta.horizon.platform.ovr.Core
import com.meta.horizon.platform.ovr.requests.PushNotification
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.BuildConfig
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate.Companion.addTokenListener
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener

private const val NEW_TOKEN_EVENT_NAME = "onDevicePushToken"
private const val NEW_TOKEN_EVENT_TOKEN_KEY = "devicePushToken"
private const val REGISTRATION_FAIL_CODE = "E_REGISTRATION_FAILED"
private const val UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE = "E_UNREGISTER_FOR_NOTIFICATIONS_FAILED"

class PushTokenModule : Module(), FirebaseTokenListener {
  private companion object {
    private const val APP_ID = BuildConfig.META_QUEST_APP_ID
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
      val mContext = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      Core.asyncInitialize(APP_ID, mContext)
    }

    /**
     * Fetches push token from Horizon platform and resolves the promise.
     *
     * @param promise Promise to be resolved with the token.
     */
    AsyncFunction("getDevicePushTokenAsync") { promise: Promise ->
      if (!Core.isInitialized()) {
        promise.reject(REGISTRATION_FAIL_CODE, "Horizon Core is not initialized", null)
        return@AsyncFunction
      }
      
      val pushNotificationRequest = PushNotification.register()

      pushNotificationRequest.onSuccess { result ->
        val token = result.id
        if (token.isNullOrEmpty()) {
          promise.reject(REGISTRATION_FAIL_CODE, "Received empty token from Horizon platform", null)
        } else {
          promise.resolve(token)
          onNewToken(token)
        }
      }
      
      pushNotificationRequest.onError { error ->
        promise.reject(REGISTRATION_FAIL_CODE, "Failed to register for push notifications: ${error.message ?: "unknown error"}", null)
      }
    }

    AsyncFunction("unregisterForNotificationsAsync") { promise: Promise ->
      if (!Core.isInitialized()) {
        promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Horizon Core is not initialized", null)
        return@AsyncFunction
      }
      
      // TODO: Implement proper unregistration when Horizon platform provides an API for it
      // For now, we can only report that unregistration is not supported
      promise.reject(UNREGISTER_FOR_NOTIFICATIONS_FAIL_CODE, "Unregistration is not currently supported on Horizon platform", null)
    }
  }
}
