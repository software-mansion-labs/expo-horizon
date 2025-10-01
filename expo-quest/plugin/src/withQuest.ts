import { ConfigPlugin, withGradleProperties, withAndroidManifest } from '@expo/config-plugins';

type HorizonOptions = {
  questAppId?: string;
  defaultHeight?: string;
  defaultWidth?: string;
};

const withQuest: ConfigPlugin<HorizonOptions> = (config, options = {}) => {

  if (process.env.EXPO_HORIZON) {
      config = withQuestEnabled(config);
      config = withQuestAppId(config, options);
      config = withPanelSize(config, options);
  }

  return config;
};

const withQuestEnabled: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: 'property',
      key: 'horizonEnabled',
      value: 'true',
    });

    return config;
  });
};

const withQuestAppId: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withGradleProperties(config, (config) => {
    const questAppId = options.questAppId || '';

    config.modResults.push({
      type: 'property',
      key: 'questAppId',
      value: questAppId,
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

export default withQuest;
