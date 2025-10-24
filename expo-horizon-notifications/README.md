# expo-horizon-notifications

A fork of [`expo-notifications`](https://github.com/expo/expo/tree/main/packages/expo-notifications) that provides two implementations:
- The default `expo-notifications` for Android and iOS platforms.
- A Meta Horizon–compatible implementation that uses the Meta's push notification service.

You can choose which implementation to use with the `quest` / `mobile` build variants. See [expo-horizon-core](../expo-horizon-core/README.md) for more details. This makes it compatible with Meta Horizon devices, while remaining a drop-in replacement for `expo-notifications` on Android and iOS.

## Prerequisites
- Expo SDK 54 or later (`expo` package version 54.0.13+).
- `expo-horizon-core` package installed. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.

## Usage

1. Install the `expo-horizon-core` package:
```bash
npx expo install expo-horizon-core
```

2. Install the package:

```bash
npx expo install expo-horizon-notifications

# and remove the old package:
npm uninstall expo-notifications
# or
yarn remove expo-notifications
```

3. Update your `app.json` / `app.config.js` to replace `expo-notifications` with `expo-horizon-notifications`.
4. Use the `questDebug` / `questRelease` build variants to run the app on Meta Quest devices. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.
5. Update your imports:

```js
// import * as Notifications from 'expo-notifications';
import * as Notifications from 'expo-horizon-notifications';
```

## Behavior
- On Meta Quest devices → Uses the Meta Horizon–compatible push notification service.
- On standard Android devices → Falls back to the default `expo-notifications` behavior using Firebase Cloud Messaging.
- On iOS it should have no effect; behavior is always the same as `expo-notifications`.

> [!IMPORTANT]
> The `quest` build variants are intended specifically for Meta Quest devices. Using them on standard Android devices is not recommended, as certain features may be unsupported or behave differently.

## Additional features

You might need additional features like `isHorizonDevice` or `isHorizonBuild` to check if the device is a Meta Horizon device. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.

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

## Contributing

1. Build the package:

```bash
cd expo-horizon-notifications
yarn build
```

2. Install, run and test the library using the example app. See [example/README.md](../example/README.md) for more details.

3. Publish the package:

```bash
npm publish --access public
```
