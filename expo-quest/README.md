# expo-quest

A comprehensive Expo module for building Android applications for Meta Quest devices. This package streamlines Quest development by automatically configuring your project with the necessary build flavors, manifest settings, and providing runtime utilities to detect and interact with Quest devices.

## Features

- 🎮 **Automatic Quest Configuration** - Config plugin that sets up your Android project for Meta Quest compliance
- 📱 **Build Flavors** - Automatically generates Quest-specific build variants alongside your standard Android builds
- ✅ **Manifest Alignment** - Ensures your AndroidManifest meets [Meta Quest requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest)
- 🔍 **Runtime Detection** - JavaScript constants to detect Quest devices and builds at runtime
- 🛠️ **Native Module Support** - Access Quest app ID from custom native modules
- ⚙️ **Flexible Configuration** - Customize panel sizing, device support, and VR features

## Installation

Install the package in your Expo project:

```bash
npm install expo-quest
# or
yarn add expo-quest
```

## Prerequisites

- Expo SDK 54 or later (`expo` package version 54.0.13+).
- Android development environment configured
- Meta Quest developer account (for publishing)

## Quick Start

1. **Add the plugin to your Expo config** (`app.json` or `app.config.js`):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-quest",
        {
          "questAppId": "your-quest-app-id",
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
import ExpoQuest from 'expo-quest';

if (ExpoQuest.isQuestDevice) {
  // Quest-specific UI or features
}
```

## Configuration

### Config Plugin

The config plugin automatically configures your Android project for Meta Quest by:

- Adding a `quest` build flavor to `build.gradle`
- Creating a Quest-specific `AndroidManifest.xml` with required permissions and features
- Configuring panel dimensions and supported devices
- Setting up VR headtracking features

### Plugin Options

Add the plugin to your `app.json` or `app.config.[js|ts]`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-quest",
        {
          "questAppId": "your-quest-app-id",
          "defaultHeight": "640dp",
          "defaultWidth": "1024dp",
          "supportedDevices": "quest2|quest3|quest3s",
          "disableVrHeadtracking": false
        }
      ]
    ]
  }
}
```

#### Available Options

| Option                  | Type      | Required | Default   | Description                                                                                                                                                                |
| ----------------------- | --------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `questAppId`            | `string`  | No       | `""`      | Your Meta Quest application ID. Required for publishing to the Meta Quest Store.                                                                                           |
| `defaultHeight`         | `string`  | No       | Not added | Default panel height in dp (e.g., `"640dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                              |
| `defaultWidth`          | `string`  | No       | Not added | Default panel width in dp (e.g., `"1024dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                              |
| `supportedDevices`      | `string`  | Yes      | None      | Pipe-separated list of supported Quest devices: `"quest2\|quest3\|quest3s"`. See [Mobile Manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/) |
| `disableVrHeadtracking` | `boolean` | No       | `false`   | Set to `true` to disable VR headtracking feature. By default, adds `android.hardware.vr.headtracking` to AndroidManifest.                                                  |

### Configuration Examples

```json
{
  "plugins": [
    [
      "expo-quest",
      {
        "questAppId": "1234567890",
        "defaultHeight": "800dp",
        "defaultWidth": "1280dp",
        "supportedDevices": "quest2|quest3|quest3s",
        "disableVrHeadtracking": false
      }
    ]
  ]
}
```

## Building and Running

The config plugin automatically creates two build flavors for your Android project:

- **`mobile`** - Standard Android build for phones and tablets
- **`quest`** - Quest-optimized build with VR-specific manifest and configuration

### Build Variants

Each flavor has debug and release variants:

| Variant         | Description                                   |
| --------------- | --------------------------------------------- |
| `mobileDebug`   | Debug build for standard Android devices      |
| `mobileRelease` | Production build for standard Android devices |
| `questDebug`    | Debug build for Meta Quest devices            |
| `questRelease`  | Production build for Meta Quest devices       |

### Running on Different Platforms

#### Run on Standard Android (Mobile)

```bash
npx expo run:android --variant mobileDebug
```

#### Run on Meta Quest

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

- **Always use the Quest variant** when deploying to Meta Quest devices
- **Quest builds include** Quest-specific AndroidManifest settings and permissions
- **Mobile builds** will not have Quest-specific configurations
- Use `npx expo prebuild --clean` after changing plugin configuration to regenerate build files

## Usage

### JavaScript/TypeScript API

The module provides runtime constants and utilities to help you build Quest-aware applications.

#### API Reference

| Property        | Type             | Description                                                                   |
| --------------- | ---------------- | ----------------------------------------------------------------------------- |
| `isQuestDevice` | `boolean`        | Returns `true` if the app is running on a physical Quest device.              |
| `isQuestBuild`  | `boolean`        | Returns `true` if the app was built with the Quest build flavor.              |
| `questAppId`    | `string \| null` | The Quest app ID configured via the config plugin. Returns `null` if not set. |

#### Basic Usage

```typescript
import ExpoQuest from 'expo-quest';

// Check if running on a Quest device
if (ExpoQuest.isQuestDevice) {
  console.log('Running on Meta Quest!');
}

// Check if this is a Quest build
if (ExpoQuest.isQuestBuild) {
  console.log('This is a Quest build variant');
}

// Access the Quest App ID
const appId = ExpoQuest.questAppId;
console.log('Quest App ID:', appId ?? 'Not configured');
```

### Usage in Custom Native Modules

#### Accessing Quest App ID in Android

You can access the Quest App ID from your custom Expo modules in Kotlin:

// TODO: Add example


# Resources

- [Meta Quest Mobile App Development](https://developers.meta.com/horizon/documentation/android-apps/mobile-overview)
- [Panel Sizing Guidelines](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)
- [Publishing Requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
