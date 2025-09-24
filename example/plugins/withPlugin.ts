import { ConfigPlugin } from 'expo/config-plugins';
import withAndroidPlugin from './withAndroidPlugin';

const withPlugin: ConfigPlugin = config => {
  config = withAndroidPlugin(config);
  return config;
};

export default withPlugin;
