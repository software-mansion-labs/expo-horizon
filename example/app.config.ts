module.exports = () => ({
  expo: {
    name: 'expo-horizon-demo',
    slug: 'expo-horizon-demo',
    version: '1.0.0',
    orientation: 'default',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.app',
    },
    android: {
      versionCode: 4,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.swmansion.horizon.demo',
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      ['expo-router'],
      [
        '../expo-horizon-location/app.plugin.js',
        {
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to access your location for background tracking',
          locationAlwaysPermission:
            'Allow $(PRODUCT_NAME) to access your location for background tracking',
          locationWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to access your location',
        },
      ],
      [
        '../expo-horizon-core/app.plugin.js',
        {
          horizonAppId: 'DEMO_APP_ID',
          defaultHeight: '640dp',
          defaultWidth: '1024dp',
          supportedDevices: 'quest2|quest3|quest3s',
          disableVrHeadtracking: false,
          allowBackup: false,
        },
      ],
      'expo-task-manager',
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
          },
        },
      ],
    ],
  },
})
