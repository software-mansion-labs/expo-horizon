# expo-quest

ExpoQuest common features.

### Add the package to your npm dependencies

```
npm install expo-quest
```

# Configuration

## Config Plugin

This package includes a config plugin that automatically configures your Android project for Meta Quest when the `EXPO_HORIZON` environment variable is set.

### Setup

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

### Options

| Option                  | Type      | Required | Default   | Description                                                                                                                                                                                                                             |
| ----------------------- | --------- | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `questAppId`            | `string`  | No       | `""`      | Your Meta Quest application ID                                                                                                                                                                                                          |
| `defaultHeight`         | `string`  | No       | Not added | Default panel height (e.g., `"640dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                                                                                                 |
| `defaultWidth`          | `string`  | No       | Not added | Default panel width (e.g., `"1024dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                                                                                                 |
| `supportedDevices`      | `string`  | Yes      | None      | Pipe-separated list of supported Quest devices (e.g., `"quest2\|quest3\|quest3s"`). See [Mobile Manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)                                                       |
| `disableVrHeadtracking` | `boolean` | No       | `false`   | Set to `true` to disable adding the VR headtracking uses-feature. By default, adds `android.hardware.vr.headtracking` to AndroidManifest. See [Mobile Manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/) |

# Usage

## JavaScript/TypeScript API

The module provides two constants to help you detect Quest devices and access the configured app ID:

```typescript
import ExpoQuest from 'expo-quest';

// Check if running on a Quest device
if (ExpoQuest.isQuestDevice) {
  console.log('Running on Meta Quest!');
}

// Access the Quest App ID (configured via config plugin)
const appId = ExpoQuest.questAppId;
if (appId) {
  console.log('Quest App ID:', appId);
} else {
  console.log('No Quest App ID configured');
}
```

## Usage in Custom Native Modules

### Accessing Quest App ID in Android

To access the Quest App ID from your custom Expo modules:

```kotlin
import expo.modules.quest.BuildConfig

val appId = BuildConfig.META_QUEST_APP_ID
```

See `ExpoQuestModule.kt` for a complete example.

# Contributing

Contributions are very welcome! Please refer to guidelines described in the [contributing guide]( https://github.com/expo/expo#contributing).
