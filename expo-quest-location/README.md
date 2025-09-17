# expo-quest-location

A fork of [`expo-location`](https://github.com/expo/expo/tree/main/packages/expo-location) that provides two implementations:
- The default `expo-location` behavior using Google Play Services.
- A Meta Quest–compatible implementation that does not rely on Google Play Services.

You can choose which implementation to use with the `EXPO_HORIZON` environment variable.
This makes it compatible with Meta Quest devices, while remaining a drop-in replacement for `expo-location` on Android and iOS.

## Usage

1. Install the package:

```bash
npx expo install expo-quest-location
```

2. Update your `app.json` / `app.config.js` to replace `expo-location` with `expo-quest-location`.
3. Prebuild your app with the `export EXPO_HORIZON=1` environment variable set (to return to the type just remove the environment variable: `unset EXPO_HORIZON`).
4. Update your imports:

```js
import * as Location from 'expo-quest-location';
```

## Behavior
- With `EXPO_HORIZON=1` → Uses the Meta Quest–compatible location API (no Google Play Services).
- Without `EXPO_HORIZON` → Falls back to the default `expo-location` behavior (Google Play Services Location API).
- On iOS → The `EXPO_HORIZON` flag has no effect; behavior is always the same as `expo-location`.

This ensures compatibility across Quest, standard Android devices, and iOS.

## Features supported on Meta Quest

| Function Name                                                                                     | Android Devices | Meta Quest      | Notes                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enableNetworkProviderAsync`                                                                      | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `getProviderStatusAsync`                                                                          | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `hasServicesEnabledAsync`                                                                         | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `requestForegroundPermissionsAsync` <br> `requestBackgroundPermissionsAsync`                      | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `getForegroundPermissionsAsync` <br> `getBackgroundPermissionsAsync`                              | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `getCurrentPositionAsync` <br> `watchPositionAsync`                                               | ✅ Supported     | ✅ Supported     | The GPS provider is not available on Quest devices. If selected, the network provider will be used instead. Note that, based on experiments, the network provider updates no more frequently than every 10 minutes. |
| `getLastKnownPositionAsync`                                                                       | ✅ Supported     | ✅ Supported     |                                                                                                                                                                                                                     |
| `watchHeadingAsync` <br> `getHeadingAsync`                                                        | ✅ Supported     | ❌ Not supported | Magnetic and accelerometer sensors are not available on Quest.                                                                                                                                                      |
| `geocodeAsync` <br> `reverseGeocodeAsync`                                                         | ✅ Supported     | ❌ Not supported | The [`Geocoder`](https://developer.android.com/reference/android/location/Geocoder) is not present on Quest.                                                                                                        |
| `startGeofencingAsync` <br> `stopGeofencingAsync` <br> `hasStartedGeofencingAsync`                | ✅ Supported     | ❓ In testing    | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |
| `startLocationUpdatesAsync` <br> `stopLocationUpdatesAsync` <br> `hasStartedLocationUpdatesAsync` | ✅ Supported     | ❓ In testing    | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |

## Contributing

1. Build the package:

```bash
cd expo-quest-location
yarn build
```

2. Install, run and test the library using the example app:

```bash
cd ../example
yarn
yarn quest # to run the app on Quest
yarn android # to run the app on Android
yarn ios # to run the app on iOS
```

> [!NOTE]
>  You need to prebuild the app to see changes reflected in the example app.

3. Publish the package:

```bash
npm publish --access public
```
