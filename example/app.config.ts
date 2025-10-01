function isQuest() {
    return process.env.EXPO_HORIZON === "1";
}

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
      "package": "com.jakubswm.questlocation",
      "blockedPermissions": isQuest() ? ["android.permission.SYSTEM_ALERT_WINDOW"] : []
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
        [
            "../expo-quest/app.plugin.js",
            {
                "questAppId": "DEMO_APP_ID",
                "defaultHeight": "640dp",
                "defaultWidth": "1024dp",
                "supportedDevices": "quest2|quest3|quest3s",
                "disableVrHeadtracking": false
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
    ]
  }
})
