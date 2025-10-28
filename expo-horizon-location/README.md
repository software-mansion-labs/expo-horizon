# expo-horizon-location

![expo-horizon-location](https://img.shields.io/npm/v/expo-horizon-location.svg)

A fork of [`expo-location`](https://github.com/expo/expo/tree/main/packages/expo-location) that provides two implementations:

- The default `expo-location` behavior using Google Play Services.
- A Meta Horizon–compatible implementation that does not rely on Google Play Services.

You can choose which implementation to use with the `quest` / `mobile` build variants. See [expo-horizon-core](../expo-horizon-core/README.md) for more details. This makes it compatible with Meta Horizon devices, while remaining a drop-in replacement for `expo-location` on Android and iOS.

## Prerequisites

- Expo SDK 54 or later (`expo` package version 54.0.13+)
- `expo-horizon-core` package installed. See [expo-horizon-core](../expo-horizon-core/README.md) for more details

## Usage

1. Install the `expo-horizon-core` package:

```bash
npx expo install expo-horizon-core
```

2. Install the package:

```bash
npx expo install expo-horizon-location

# and remove the old package:
npm uninstall expo-location
# or
yarn remove expo-location
```

3. Update your `app.json` / `app.config.js` to replace `expo-location` with `expo-horizon-location`.
4. Use the `questDebug` / `questRelease` build variants to run the app on Meta Quest devices. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.
5. Update your imports:

```js
import * as Location from 'expo-horizon-location';
```

## Behavior

- On Meta Quest devices → Uses the Meta Horizon–compatible push notification service.
- On standard Android devices → Falls back to the default `expo-location` behavior using Google Play Services.
- On iOS it should have no effect; behavior is always the same as `expo-location`.

> [!IMPORTANT]
> The `quest` build variants are intended specifically for Meta Quest devices. Using them on standard Android devices is not recommended, as certain features may be unsupported or behave differently.

## Additional features

You might need additional features like `isHorizonDevice` or `isHorizonBuild` to check if the device is a Meta Horizon device. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.

## Features supported on Meta Horizon OS

| Function Name                                                                                     | Android Devices | Meta Quest       | Notes                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | --------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enableNetworkProviderAsync`                                                                      | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `getProviderStatusAsync`                                                                          | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `hasServicesEnabledAsync`                                                                         | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `requestForegroundPermissionsAsync` <br> `requestBackgroundPermissionsAsync`                      | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `getForegroundPermissionsAsync` <br> `getBackgroundPermissionsAsync`                              | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `getCurrentPositionAsync` <br> `watchPositionAsync`                                               | ✅ Supported    | ✅ Supported     | The GPS provider is not available on Quest devices. If selected, the network provider will be used instead. Note that, based on experiments, the network provider updates no more frequently than every 10 minutes. |
| `getLastKnownPositionAsync`                                                                       | ✅ Supported    | ✅ Supported     |                                                                                                                                                                                                                     |
| `watchHeadingAsync` <br> `getHeadingAsync`                                                        | ✅ Supported    | ❌ Not supported | Magnetic and accelerometer sensors are not available on Quest.                                                                                                                                                      |
| `geocodeAsync` <br> `reverseGeocodeAsync`                                                         | ✅ Supported    | ❌ Not supported | The [`Geocoder`](https://developer.android.com/reference/android/location/Geocoder) is not present on Quest.                                                                                                        |
| `startGeofencingAsync` <br> `stopGeofencingAsync` <br> `hasStartedGeofencingAsync`                | ✅ Supported    | ❌ Not supported | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |
| `startLocationUpdatesAsync` <br> `stopLocationUpdatesAsync` <br> `hasStartedLocationUpdatesAsync` | ✅ Supported    | ❌ Not supported | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |

## Version compatibility

Our goal is to align the version numbers of `expo-horizon-location` and `expo-location` for easier upgrades. However, since this fork is still under development, we are currently using a separate versioning scheme.

| `expo-horizon-location` | `expo-location` |
| ----------------------- | --------------- |
| 0.0.3                   | 18.1.17         |

## Expo Horizon Location is created by Software Mansion

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=expo-horizon-location-github 'Software Mansion')](https://swmansion.com)

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with
experience in building web and mobile apps. We are Core React Native
Contributors and experts in dealing with all kinds of React Native issues. We
can help you build your next dream product –
[Hire us](https://swmansion.com/contact/projects?utm_source=expo-horizon-location&utm_medium=readme).

Made by [@software-mansion](https://github.com/software-mansion) and
[community](https://github.com/software-mansion-labs/expo-horizon/graphs/contributors) 💛
