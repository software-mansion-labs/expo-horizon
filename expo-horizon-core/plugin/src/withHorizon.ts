import { ConfigPlugin, withGradleProperties, withAndroidManifest } from '@expo/config-plugins';

import withCustomAndroidManifest from './withCustomAndroidManifest';
import { withProhibitedPermissions } from './withProhibitedPermissions';

export type HorizonOptions = {
  /**
   * Your Meta Horizon application ID.
   * Used by other libraries (like expo-horizon-notifications) to identify your app.
   * @default ""
   * @see https://developers.meta.com/horizon/resources/publish-overview-appID/#creating-an-app-id
   */
  horizonAppId?: string;

  /**
   * Default panel height in dp.
   * @example "640dp"
   * @see https://developers.meta.com/horizon/documentation/android-apps/panel-sizing
   */
  defaultHeight?: string;

  /**
   * Default panel width in dp.
   * @example "1024dp"
   * @see https://developers.meta.com/horizon/documentation/android-apps/panel-sizing
   */
  defaultWidth?: string;

  /**
   * Pipe-separated list of supported Quest devices.
   * @example "quest2|quest3|quest3s"
   * @see https://developers.meta.com/horizon/resources/publish-mobile-manifest/
   */
  supportedDevices?: string;

  /**
   * Set to `true` to disable VR headtracking feature.
   * By default, adds `android.hardware.vr.headtracking` to the Android Manifest.
   */
  disableVrHeadtracking?: boolean;

  /**
   * Set to true in the Quest build to enable Android's allowBackup feature.
   * The default value is false which removes the "allowBackup=true" warning in the Meta Horizon Store.
   * This does not affect your mobile build variant.
   */
  allowBackup?: boolean;
};

const USE_EXPERIMENTAL_PLUGIN = true;

const withHorizon: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  config = withHorizonAppId(config, options);

  if (USE_EXPERIMENTAL_PLUGIN) {
    config = withCustomAndroidManifest(config, options);
  } else if (process.env.EXPO_HORIZON) {
    // This is the old approach, we should remove it in the future
    // TODO: Remove this
    config = withHorizonEnabled(config);
    config = withPanelSize(config, options);
    config = withSupportedDevices(config, options);
    config = withVrHeadtracking(config, options);
    config = withProhibitedPermissions(config);
  }

  return config;
};

const withHorizonEnabled: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'horizonEnabled',
      value: 'true',
    });

    return config;
  });
};

const withHorizonAppId: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withGradleProperties(config, (config) => {
    const horizonAppId = options.horizonAppId ?? '';

    config.modResults.push({
      type: 'property',
      key: 'horizonAppId',
      value: horizonAppId,
    });

    return config;
  });
};

const withPanelSize: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withAndroidManifest(config, (config) => {
    // Only add layout if at least one dimension is provided
    if (!options.defaultHeight && !options.defaultWidth) {
      return config;
    }

    const mainActivity = config.modResults.manifest?.application?.[0]?.activity?.find(
      (activity: any) => activity.$?.['android:name'] === '.MainActivity'
    ) as any;

    if (mainActivity) {
      if (!mainActivity.layout) {
        mainActivity.layout = [];
      }

      const layoutAttrs: any = {};
      if (options.defaultHeight) {
        layoutAttrs['android:defaultHeight'] = options.defaultHeight;
      }
      if (options.defaultWidth) {
        layoutAttrs['android:defaultWidth'] = options.defaultWidth;
      }

      mainActivity.layout.push({
        $: layoutAttrs,
      });
    }

    return config;
  });
};

const withSupportedDevices: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withAndroidManifest(config, (config) => {
    // Only add meta-data if supportedDevices is explicitly provided
    if (!options.supportedDevices) {
      return config;
    }

    const application = config.modResults.manifest?.application?.[0];

    if (application) {
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      application['meta-data'].push({
        $: {
          'android:name': 'com.oculus.supportedDevices',
          'android:value': options.supportedDevices,
        },
      });
    }

    return config;
  });
};

const withVrHeadtracking: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withAndroidManifest(config, (config) => {
    // Add VR headtracking by default unless explicitly disabled
    if (options.disableVrHeadtracking === true) {
      return config;
    }

    const manifest = config.modResults.manifest;

    if (manifest) {
      if (!manifest['uses-feature']) {
        manifest['uses-feature'] = [];
      }

      manifest['uses-feature'].push({
        $: {
          'android:name': 'android.hardware.vr.headtracking',
          'android:required': 'true',
          'android:version': '1',
        },
      } as any);
    }

    return config;
  });
};

export default withHorizon;
