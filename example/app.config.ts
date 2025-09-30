import 'tsx/cjs';

module.exports = () => ({
  "expo": {
    "name": "expo-quest-demo",
    "slug": "expo-quest-demo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.app"
    },
    "android": {
      "versionCode": 3,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "edgeToEdgeEnabled": true,
      "package": "com.jakubswm.questlocation"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
        ["expo-router"],
        [
            "../expo-quest-location/app.plugin.js",
            {
                "isAndroidBackgroundLocationEnabled": true,
                "isAndroidForegroundServiceEnabled": true,
                "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location for background tracking",
                "locationAlwaysPermission": "Allow $(PRODUCT_NAME) to access your location for background tracking",
                "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to access your location"
            }
        ],
        "expo-task-manager",
        [
        "expo-build-properties",
            {
                "android": {
                    "compileSdkVersion": 34,
                    "targetSdkVersion": 34,
                }
            }
        ],
        ["./plugins/withPlugin.ts"],
    ]
  }
})
