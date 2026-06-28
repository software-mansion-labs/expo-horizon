import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name!,
  slug: config.slug!,
  plugins: [
    ...(config.plugins ?? []),
    [
      '../expo-horizon-location/app.plugin.js',
      {
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
        // isAndroidMotionActivityEnabled omitted: ACTIVITY_RECOGNITION is prohibited on the Horizon Store.
        isAndroidMotionActivityEnabled: true,
        locationAlwaysAndWhenInUsePermission:
          'Allow $(PRODUCT_NAME) to access your location for background tracking',
        locationAlwaysPermission:
          'Allow $(PRODUCT_NAME) to access your location for background tracking',
        locationWhenInUsePermission: 'Allow $(PRODUCT_NAME) to access your location',
      },
    ],
    '../expo-horizon-notifications/app.plugin.js',
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
  ],
});
