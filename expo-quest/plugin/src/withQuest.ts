import { ConfigPlugin, withGradleProperties } from '@expo/config-plugins';

type HorizonOptions = {
  questAppId?: string;
};

const withQuest: ConfigPlugin<HorizonOptions> = (config, options = {}) => {

  if (process.env.EXPO_HORIZON) {
      config = withQuestEnabled(config);
      config = withQuestAppId(config, options);
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

export default withQuest;
