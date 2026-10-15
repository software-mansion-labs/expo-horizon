import { ConfigPlugin, withGradleProperties, withAndroidManifest } from '@expo/config-plugins';

import withCustomAndroidManifest from './withCustomAndroidManifest';
import { withProhibitedPermissions } from './withProhibitedPermissions';

export type HorizonOptions = {
  /**
   * Your Meta Horizon application ID.
   * Used by other libraries (like expo-horizon-notifications) to identify your app.
   * Use a string without whitespace, quotes, or backslashes; an empty string leaves it unset.
   * @default ""
   * @see https://developers.meta.com/horizon/resources/publish-overview-appID/#creating-an-app-id
   */
  horizonAppId?: string;

  /**
   * Default panel height as a positive dp dimension.
   * @example "640dp"
   * @see https://developers.meta.com/vr/essentials/horizon-os-panel-sizing/
   */
  defaultHeight?: string;

  /**
   * Default panel width as a positive dp dimension.
   * @example "1024dp"
   * @see https://developers.meta.com/vr/essentials/horizon-os-panel-sizing/
   */
  defaultWidth?: string;

  /**
   * Pipe-separated list of supported Quest devices.
   * Device names may contain letters, digits, underscores, or hyphens.
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
  validateHorizonOptions(options);
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

function validateHorizonOptions(options: HorizonOptions) {
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    throw new Error('[expo-horizon-core] Plugin options must be an object.');
  }

  if (
    options.horizonAppId !== undefined &&
    (typeof options.horizonAppId !== 'string' || /[\s"'\\]/.test(options.horizonAppId))
  ) {
    throw new Error(
      '[expo-horizon-core] horizonAppId must be a string without whitespace, quotes, or backslashes. Use "" to leave it unset.'
    );
  }

  if (
    options.supportedDevices !== undefined &&
    (typeof options.supportedDevices !== 'string' ||
      !/^[A-Za-z0-9_-]+(?:\|[A-Za-z0-9_-]+)*$/.test(options.supportedDevices))
  ) {
    throw new Error(
      '[expo-horizon-core] supportedDevices must be a non-empty pipe-separated string of device names (letters, digits, underscores, or hyphens), e.g. "quest2|quest3|quest3s".'
    );
  }

  for (const key of ['disableVrHeadtracking', 'allowBackup'] as const) {
    if (options[key] !== undefined && typeof options[key] !== 'boolean') {
      throw new Error(`[expo-horizon-core] ${key} must be a boolean (true or false).`);
    }
  }

  validatePanelDimensions(options);
}

function validatePanelDimensions(options: HorizonOptions) {
  for (const key of ['defaultWidth', 'defaultHeight'] as const) {
    const value = options[key];
    if (
      value !== undefined &&
      (typeof value !== 'string' ||
        !/^\d+(?:\.\d+)?dp$/.test(value) ||
        !Number.isFinite(parseFloat(value)) ||
        parseFloat(value) <= 0)
    ) {
      throw new Error(`[expo-horizon-core] ${key} must be a positive dp dimension, e.g. "360dp".`);
    }
  }
}

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

    config.modResults = config.modResults.filter(
      (item) => item.type !== 'property' || item.key !== 'horizonAppId'
    );
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
