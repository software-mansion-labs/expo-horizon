# expo-horizon-notifications

A fork of [`expo-notifications`](https://github.com/expo/expo/tree/main/packages/expo-notifications) that provides two implementations:
- The default `expo-notifications` for Android and iOS platforms.
- A Meta Horizon–compatible implementation that uses the Meta's push notification service.

You can choose which implementation to use with the `EXPO_HORIZON` environment variable.
This makes it compatible with Meta Horiozn devices, while remaining a drop-in replacement for `expo-notifications` on Android and iOS.

## Usage

1. Install the package:

```bash
npx expo install expo-horizon-notifications
```

2. Update your `app.json` / `app.config.js` to replace `expo-notifications` with `expo-horizon-notifications`.
3. Prebuild your app with the `export EXPO_HORIZON=1` environment variable set (to return to the type just remove the environment variable: `unset EXPO_HORIZON`).
4. Update your imports:

```js
// import * as Notifications from 'expo-notifications';
import * as Notifications from 'expo-horizon-notifications';
```

## Behavior
- With `EXPO_HORIZON=1` → Uses the Meta Horizon–compatible push notification service.
- Without `EXPO_HORIZON` → Falls back to the default `expo-notifications` behavior.
- On iOS → The `EXPO_HORIZON` flag has no effect; behavior is always the same as `expo-notifications`.

This ensures compatibility across Horizon OS, standard Android devices, and iOS.

## Features supported on Meta Horizon OS 

| Function Name                                                                    | Meta Quest          | Notes                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `addPushTokenListener`                                                           | 🛠️ Under development |                                                                                                               |
| `getDevicePushTokenAsync`                                                        | 🛠️ Under development |                                                                                                               |
| `getExpoPushTokenAsync`                                                          | ❌ Not supported     | Currently, support for the Expo Push Service is not planned.                                                  |
| `addNotificationReceivedListener` <br> `addNotificationResponseReceivedListener` | ✅ Supported         |                                                                                                               |
| `addNotificationsDroppedListener` <br> `useLastNotificationResponse`             | 🔍 Not tested yet    |                                                                                                               |
| `setNotificationHandler`                                                         | 🔍 Not tested yet    |                                                                                                               |
| `registerTaskAsync` <br> `unregisterTaskAsync`                                   | 🔍 Not tested yet    |                                                                                                               |
| `getPermissionsAsync` <br> `requestPermissionsAsync`                             | 🔍 Not tested yet    |                                                                                                               |
| `getBadgeCountAsync` <br> `setBadgeCountAsync`                                   | ❌ Not supported     | The [underlying library](https://github.com/leolin310148/ShortcutBadger) does not support this functionality. |
| `cancelAllScheduledNotificationsAsync` <br> `cancelScheduledNotificationAsync`   | ✅ Supported         |                                                                                                               |
| `getAllScheduledNotificationsAsync`                                              | ✅ Supported         |                                                                                                               |
| `getNextTriggerDateAsync`                                                        | ✅ Supported         |                                                                                                               |
| `scheduleNotificationAsync`                                                      | ✅ Supported         |                                                                                                               |
| `dismissAllNotificationsAsync` <br> `dismissNotificationAsync`                   | 🔍 Not tested yet    |                                                                                                               |
| `getPresentedNotificationsAsync`                                                 | 🔍 Not tested yet    |                                                                                                               |
| Manage notification channels                                                     | 🔍 Not tested yet    |                                                                                                               |
| Manage notification categories (interactive notifications)                       | 🔍 Not tested yet    |                                                                                                               |
| `clearLastNotificationResponse` <br> `clearLastNotificationResponseAsync`        | 🔍 Not tested yet    |                                                                                                               |
| `getLastNotificationResponse` <br> `getLastNotificationResponseAsync`            | 🔍 Not tested yet    |                                                                                                               |
| `unregisterForNotificationsAsync`                                                | 🔍 Not tested yet    |                                                                                                               |

