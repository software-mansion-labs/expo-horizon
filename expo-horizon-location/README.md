# expo-horizon-location

A fork of [`expo-location`](https://github.com/expo/expo/tree/main/packages/expo-location) that provides two implementations:
- The default `expo-location` behavior using Google Play Services.
- A Meta Horizon–compatible implementation that does not rely on Google Play Services.

You can choose which implementation to use with the `quest` / `mobile` build variants. See [expo-horizon-core](../expo-horizon-core/README.md) for more details. This makes it compatible with Meta Horizon devices, while remaining a drop-in replacement for `expo-location` on Android and iOS.

## Usage

1. Install the package:

```bash
npx expo install expo-horizon-location
```

2. Update your `app.json` / `app.config.js` to replace `expo-location` with `expo-horizon-location`.
3. Use the `questDebug` / `questRelease` build variants to run the app on Meta Quest devices. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.
4. Update your imports:

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
- `Location.isHorizon()` → Returns `true` if the device is a Meta Horizon device.

## Features supported on Meta Horizon OS

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
| `startGeofencingAsync` <br> `stopGeofencingAsync` <br> `hasStartedGeofencingAsync`                | ✅ Supported     | ❌ Not supported | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |
| `startLocationUpdatesAsync` <br> `stopLocationUpdatesAsync` <br> `hasStartedLocationUpdatesAsync` | ✅ Supported     | ❌ Not supported | Meta Horizon Store doesn't support `ACCESS_BACKGROUND_LOCATION` Android permission.                                                                                                                                 |

## Contributing

1. Build the package:

```bash
cd expo-horizon-location
yarn build
```

2. Install, run and test the library using the example app. See [example/README.md](../example/README.md) for more details.

3. Publish the package:

```bash
npm publish --access public
```
