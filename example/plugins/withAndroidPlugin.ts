import { ConfigPlugin, withAndroidManifest } from 'expo/config-plugins';

const withAndroidPlugin: ConfigPlugin = config => {

  return withAndroidManifest(config, config => {
    const manifest = config?.modResults?.manifest;

    // Remove android.permission.SYSTEM_ALERT_WINDOW from uses-permission
    if (manifest && Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter(
        (permission: any) =>
          !(
            permission &&
            permission.$ &&
            permission.$['android:name'] === 'android.permission.SYSTEM_ALERT_WINDOW'
          )
      );
    }

    return config;
  });
};

export default withAndroidPlugin;
