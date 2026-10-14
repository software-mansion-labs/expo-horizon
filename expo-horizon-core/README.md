![Expo Horizon Core logo](https://raw.githubusercontent.com/software-mansion-labs/expo-horizon/refs/heads/main/expo-horizon-core/docs/images/cover_image.png)

![expo-horizon-core](https://img.shields.io/npm/v/expo-horizon-core.svg)

A comprehensive Expo module for building Android applications for Meta Quest devices. This package streamlines Horizon development by automatically configuring your project with the necessary build flavors, manifest settings, and providing runtime utilities to detect and interact with Horizon devices.

## Features

- 🎮 **Automatic Horizon Configuration** - Config plugin that sets up your Android project for Meta Horizon OS compliance
- 📱 **Build Flavors** - Automatically generates Horizon-specific build variants alongside your standard Android builds
- ✅ **Manifest Alignment** - Ensures your AndroidManifest meets [Meta Horizon requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest)
- 🔍 **Runtime Detection** - JavaScript constants to detect Horizon devices and builds at runtime
- 🧩 **Horizon OS SDK Checks** - Check OS API availability and configure Horizon minimum/target SDK versions
- 🛠️ **Native Module Support** - Access Horizon app ID from custom native modules
- ⚙️ **Flexible Configuration** - Customize panel sizing, device support, and VR features

## Installation

Install the package in your Expo project:

```bash
npm install expo-horizon-core
# or
yarn add expo-horizon-core
```

## Prerequisites

- Expo SDK 57 or later (`expo` package version 57.0.15+)
- Android development environment configured
- Meta Quest developer account (for publishing)

## Useful resources

- [Meta Quest Developer Hub](https://developers.meta.com/horizon/documentation/android-apps/meta-quest-developer-hub) - Essential for Meta Quest development; offers features such as video casting, device storage access, and app management.

## Quick Start

1. **Add the plugin to your Expo config** (`app.json` or `app.config.js`):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-horizon-core",
        {
          "horizonAppId": "your-horizon-app-id",
          "supportedDevices": "quest2|quest3|quest3s"
        }
      ]
    ]
  }
}
```

2. **Rebuild your project** to apply the configuration:

```bash
npx expo prebuild --clean
```

3. **Use the runtime API** in your code:

```typescript
import ExpoHorizon from 'expo-horizon-core';

if (ExpoHorizon.isHorizonDevice) {
  // Horizon-specific UI or features
}
```

4. Migrate libraries to Meta Quest–compatible forks

| Library              | Quest-Compatible Fork                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expo-location`      | [`expo-horizon-location`](https://github.com/software-mansion-labs/expo-horizon/tree/main/expo-horizon-location)           |
| `expo-notifications` | [`expo-horizon-notifications`](https://github.com/software-mansion-labs/expo-horizon/tree/main/expo-horizon-notifications) |

## Configuration

### Config Plugin

The config plugin automatically configures your Android project for Meta Horizon by:

- Adding a `quest` build flavor to `build.gradle`
- Creating a Horizon-specific `AndroidManifest.xml` with required permissions and features
- Configuring panel dimensions and supported devices
- Setting up VR headtracking features

### Plugin Options

Add the plugin to your `app.json` or `app.config.[js|ts]`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-horizon-core",
        {
          "horizonAppId": "your-horizon-app-id",
          "defaultHeight": "640dp",
          "defaultWidth": "1024dp",
          "supportedDevices": "quest2|quest3|quest3s",
          "disableVrHeadtracking": false,
          "allowBackup": false
        }
      ]
    ]
  }
}
```

#### Available Options

Horizon OS SDK options (see [SDK version configuration](#horizon-os-sdk-versions)):

| Option                    | Type     | Default   | Description                                        |
| ------------------------- | -------- | --------- | -------------------------------------------------- |
| `horizonMinSdkVersion`    | `number` | Not added | Minimum Meta VR OS SDK required by the Quest app.  |
| `horizonTargetSdkVersion` | `number` | Not added | Meta VR OS SDK behavior targeted by the Quest app. |

| Option                  | Type      | Required | Default   | Description                                                                                                                                                                                                                      |
| ----------------------- | --------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizonAppId`          | `string`  | No       | `""`      | Your Meta Horizon application ID. Used by other libraries (like `expo-horizon-notifications`) to identify your app.                                                                                                              |
| `defaultHeight`         | `string`  | No       | Not added | Default panel height in dp (e.g., `"640dp"`). See [Panel Sizing](https://developers.meta.com/vr/essentials/horizon-os-panel-sizing/)                                                                                             |
| `defaultWidth`          | `string`  | No       | Not added | Default panel width in dp (e.g., `"1024dp"`). See [Panel Sizing](https://developers.meta.com/vr/essentials/horizon-os-panel-sizing/)                                                                                             |
| `minWidth`              | `string`  | No       | Not added | Minimum panel width for the Quest build, as a positive dp dimension (e.g., `"600dp"`).                                                                                                                                           |
| `minHeight`             | `string`  | No       | Not added | Minimum panel height for the Quest build, as a positive dp dimension (e.g., `"400dp"`).                                                                                                                                          |
| `supportedDevices`      | `string`  | Yes      | None      | Pipe-separated list of supported Quest devices: `"quest2\|quest3\|quest3s"`. See [Mobile Manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)                                                       |
| `disableVrHeadtracking` | `boolean` | No       | `false`   | Set to `true` to disable VR headtracking feature. By default, adds `android.hardware.vr.headtracking` to AndroidManifest.                                                                                                        |
| `allowBackup`           | `boolean` | No       | `false`   | Set to `true` in the Quest build to enable Android's `allowBackup` feature. The default value is `false` which removes the "allowBackup=true" warning in the Meta Horizon Store. This does not affect your mobile build variant. |

> **Meta Horizon Store Recommendation for `allowBackup`:**
>
> If the application is storing sensitive information on the device, it is recommended to disable backups by setting `allowBackup="false"` in your application's AndroidManifest.

### Configuration Examples

#### Horizon OS SDK versions

The optional `horizonMinSdkVersion` and `horizonTargetSdkVersion` settings declare
the Meta VR OS SDK versions for the **Quest build**. They do not change Android's
`minSdkVersion` or `targetSdkVersion`, or the mobile build's manifest.

```json
{
  "plugins": [
    [
      "expo-horizon-core",
      {
        "supportedDevices": "quest2|quest3|quest3s",
        "horizonTargetSdkVersion": 207
      }
    ]
  ]
}
```

- `horizonMinSdkVersion`: the oldest Meta VR OS SDK your app requires. Leave it
  unset if newer features are optional and your app supplies a fallback.
- `horizonTargetSdkVersion`: the Meta VR OS SDK behavior version your app targets.
  Set it to a version against which you test your app.

Both settings are omitted by default. Values must be integers from 61 through
2147483647; when both are supplied, the target must be at least the minimum.
The plugin writes the namespaced `metavr:uses-metavr-sdk` element in the Quest
manifest. Raising the minimum can prevent installation on OS versions below that
minimum. Horizon OS recognizes this declaration from SDK 207 onward; older
releases can ignore it, so continue to guard newer API calls at runtime.
See [Meta VR OS SDK versioning](https://developers.meta.com/vr/documentation/android-apps/metavr-os-sdk-versioning/).

#### Panel and device settings

```json
{
  "plugins": [
    [
      "expo-horizon-core",
      {
        "horizonAppId": "1234567890",
        "defaultHeight": "800dp",
        "defaultWidth": "1280dp",
        "minWidth": "600dp",
        "minHeight": "400dp",
        "supportedDevices": "quest2|quest3|quest3s",
        "disableVrHeadtracking": false
      }
    ]
  ]
}
```

`defaultWidth` and `defaultHeight` set the initial panel size. The optional
`minWidth` and `minHeight` declare the smallest dimensions the panel can resize
to. Choose minimums only if your layout becomes unusable below those sizes; the
app still needs to adapt to other panel sizes.

Minimums must be positive dp strings, such as `"600dp"` or `"360.5dp"`. Either
can be configured independently, with or without default dimensions. Unset values
are omitted from the manifest. These settings apply to the Quest build only;
rerun Android prebuild and rebuild the app after changing them.
See Meta's [Android app configuration](https://developers.meta.com/vr/documentation/android-apps/create-app/).

> **Setting default dimensions:**
>
> If your app renders with black bars after setting `defaultWidth` or `defaultHeight`, ensure the orientation value in your `app.config.ts` is set correctly to match the specified dimensions. For more information, refer to the official (expo documentation)[https://docs.expo.dev/versions/latest/sdk/screen-orientation/]

## Building and Running

The config plugin automatically creates two build flavors for your Android project:

- **`mobile`** - Standard Android build for phones and tablets
- **`quest`** - Build prepared for Horizon OS devices with VR-specific manifest and configuration

### Build Variants

Each flavor has debug and release variants:

| Variant         | Description                                   |
| --------------- | --------------------------------------------- |
| `mobileDebug`   | Debug build for standard Android devices      |
| `mobileRelease` | Production build for standard Android devices |
| `questDebug`    | Debug build for Meta Horizon OS devices       |
| `questRelease`  | Production build for Meta Horizon OS devices  |

### Running on Different Platforms

#### Run on Standard Android (Mobile)

```bash
npx expo run:android --variant mobileDebug
```

#### Run on Meta Horizon devices

```bash
npx expo run:android --variant questDebug
```

### Package.json Scripts

For convenience, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "android": "expo run:android --variant mobileDebug",
    "quest": "expo run:android --variant questDebug",
    "android:release": "expo run:android --variant mobileRelease",
    "quest:release": "expo run:android --variant questRelease"
  }
}
```

Then run with:

```bash
# Development
npm run android    # Run mobile build
npm run quest      # Run Quest build

# Production
npm run android:release
npm run quest:release
```

### Important Notes

- **Always use the Quest variant** when deploying to Meta Horizon OS devices
- **Quest builds include** Horizon-specific AndroidManifest settings and permissions
- **Mobile builds** will not have Horizon-specific configurations
- Use `npx expo prebuild --clean` after changing plugin configuration to regenerate build files

## Usage

### JavaScript/TypeScript API

The module provides runtime constants and utilities to help you build Horizon-aware applications.

#### API Reference

| Property            | Type             | Description                                                                     |
| ------------------- | ---------------- | ------------------------------------------------------------------------------- |
| `isHorizonDevice`   | `boolean`        | Detects Horizon OS, with a fallback for older Quest devices.                    |
| `isHorizonBuild`    | `boolean`        | Returns `true` if the app was built with the Quest build flavor.                |
| `horizonAppId`      | `string \| null` | The Horizon App ID configured via the config plugin. Returns `null` if not set. |
| `horizonSdkVersion` | `number \| null` | The device's current Horizon OS SDK version, or `null` when unavailable.        |
| `horizonOsVersion`  | `string \| null` | The user-facing Horizon OS version label, or `null` when unavailable.           |

#### Basic Usage

The synchronous method `isHorizonSdkVersionAtLeast(version: number): boolean`
checks OS SDK availability. See [Checking Horizon OS SDK support](#checking-horizon-os-sdk-support).

```typescript
import ExpoHorizon from 'expo-horizon-core';

// Check if running on a Horizon device
if (ExpoHorizon.isHorizonDevice) {
  console.log('Running on Meta Horizon OS!');
}

// Check if this is a Horizon build
if (ExpoHorizon.isHorizonBuild) {
  console.log('This is a Horizon build variant');
}

// Access the Horizon App ID
const appId = ExpoHorizon.horizonAppId;
console.log('Horizon App ID:', appId ?? 'Not configured');

// Display the OS version in an About screen or diagnostic report.
console.log('Horizon OS:', ExpoHorizon.horizonOsVersion ?? 'Unavailable');
```

### Horizon OS detection and display version

On Android, `isHorizonDevice` uses Meta's
[Horizon OS detector](https://developers.meta.com/vr/reference/metavrx-os-utility/v1.0/class_metavrx_os_horizon_os_detector/)
to check system features, independently of the device's manufacturer/model name
and the app's build flavor. If the detector returns `false`, the previous Expo
Quest model check remains as a fallback for older devices. It returns `false` on
iOS and web.

`horizonOsVersion: string | null` is a read-only, user-facing version label from
[`Build.Version.getDisplayName()`](https://developers.meta.com/vr/reference/metavr-os-jsdk/v207/class_metavr_os_build/).
Android falls back to the earlier `horizonos` API name when needed. The value is
returned unchanged; do not parse it or use it for version comparisons. Use
`horizonSdkVersion` or `isHorizonSdkVersionAtLeast()` for API compatibility checks.

The display version is `null` on non-Horizon Android, iOS, web, and Horizon
releases without a supported display-version API. It requires no permissions,
app ID, or Platform SDK connection.

### Checking Horizon OS SDK support

```typescript
import ExpoHorizon from 'expo-horizon-core';

// Read the version directly for display, diagnostics, or your own comparisons.
const sdkVersion = ExpoHorizon.horizonSdkVersion;
console.log('Horizon OS SDK:', sdkVersion ?? 'Unavailable');

const supportsSdk207 = ExpoHorizon.isHorizonSdkVersionAtLeast(207);
// Use this result to enable an optional SDK 207 feature or show its fallback.
```

`horizonSdkVersion: number | null` is a read-only constant containing the device's
current **Meta VR OS SDK version**, such as `207`. This is independent of Android's
API level, the user-facing OS version string, the app's configured minimum/target
SDK, and the app's build flavor. A mobile build running on Horizon OS can also
read the version. It returns `null` on non-Horizon Android, iOS, web, and older
Horizon releases without a supported version API.

Android reads the [OS SDK version API](https://developers.meta.com/vr/reference/metavr-os-jsdk/v207/class_metavr_os_build/),
falling back to its earlier Horizon OS and VR OS names when needed. The JSDK is a
compile-only dependency: its API stubs are not packaged in your app.

`isHorizonSdkVersionAtLeast(version: number): boolean` is a synchronous convenience
method for checking SDK availability without reading and comparing the number.

The method returns `false` on non-Horizon Android devices, iOS, web, and older
Horizon OS versions where the requested SDK is unavailable. It throws for
non-integer values, versions below 61, or values above 2147483647. You do not need
an app ID, permission, or Platform SDK service connection to call it.

Android uses Meta's [OS Utility Library](https://developers.meta.com/vr/documentation/android-apps/metavrx-os-utility-library/)
(`com.meta.metavrx.util:util:1.0.0`) to handle absent OS APIs safely. Rebuild your
development client after updating the package. This check does not itself enable
features or guarantee that a feature's hardware and permissions are available.

### Usage in Custom Native Modules

#### Accessing Horizon App ID in Android

To access the Horizon App ID from your custom Expo modules written in Kotlin, follow these steps:

1. Add the configuration field to your `build.gradle`:

```gradle
// The `horizonAppId` property is added by the expo-horizon-core config plugin.
def horizonAppIdConfigField = "\"${project.findProperty('horizonAppId') ?: ''}\""

android {
  defaultConfig {
    buildConfigField "String", "META_HORIZON_APP_ID", horizonAppIdConfigField
  }
}
```

2. Access the Horizon App ID in your native module code:

```kotlin
val horizonAppId = BuildConfig.META_HORIZON_APP_ID
```

Now, `horizonAppId` will contain the value of your Horizon App ID as defined in your build configuration.

## Version compatibility

| `expo-horizon-core` | Expo SDK Version |
| ------------------- | ---------------- |
| 57.0.0-57.0.3       | 57               |
| 56.0.0              | 56               |
| 55.0.0-55.0.1       | 55               |
| 1.0.7               | 54               |

## Resources

- [Meta Horizon Mobile App Development](https://developers.meta.com/horizon/documentation/android-apps/mobile-overview)
- [Panel Sizing Guidelines](https://developers.meta.com/vr/essentials/horizon-os-panel-sizing/)
- [Publishing Requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

## Troubleshooting

### `expo run:android` fails because `app:installDebug` is ambiguous

The config plugin creates `mobile` and `quest` Android product flavors. As a
result, the default `expo run:android` command cannot choose an `installDebug`
task and may fail with:

```text
Cannot locate tasks that match 'app:installDebug' as task 'installDebug' is ambiguous.
```

Run Expo with an explicit variant instead:

```bash
npx expo run:android --variant mobileDebug
# or, for Meta Horizon devices:
npx expo run:android --variant questDebug
```

To avoid specifying the variant each time, add the
[package scripts](#packagejson-scripts) above and run `npm run android` or
`npm run quest`.

## Contributing

Contributions are very welcome! Please refer to the guidelines described in the [contributing guide](https://github.com/software-mansion-labs/expo-horizon/blob/main/CONTRIBUTING.md).

## Expo Horizon Core is created by Software Mansion

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=expo-horizon-core-github 'Software Mansion')](https://swmansion.com)

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with
experience in building web and mobile apps. We are Core React Native
Contributors and experts in dealing with all kinds of React Native issues. We
can help you build your next dream product –
[Hire us](https://swmansion.com/contact/projects?utm_source=expo-horizon-core&utm_medium=readme).

Made by [@software-mansion](https://github.com/software-mansion) and
[community](https://github.com/software-mansion-labs/expo-horizon/graphs/contributors) 💛
