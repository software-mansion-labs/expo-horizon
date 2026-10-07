/* eslint-disable @typescript-eslint/no-require-imports -- Jest loads this configuration as CommonJS. */
const pluginPreset = { ...require('expo-module-scripts/jest-preset-plugin') };
const path = require('path');

const babelConfig = require.resolve('expo-module-scripts/babel.config.base.js');

function nativeProject(packageName, platform) {
  const preset = { ...require(`jest-expo/${platform}/jest-preset`) };
  delete preset.watchPlugins;
  return {
    ...preset,
    displayName: `${packageName}/${platform}`,
    rootDir: path.join(__dirname, packageName),
    roots: ['<rootDir>/src'],
    setupFilesAfterEnv: [path.join(__dirname, 'tests/jest-native-setup.js')],
    transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
      pattern.replace('(?!(.pnpm|', '(?!(jest-expo|.pnpm|')
    ),
    transform: {
      ...preset.transform,
      '\\.[jt]sx?$': [
        'babel-jest',
        {
          configFile: babelConfig,
          caller: { name: 'metro', bundler: 'metro', platform },
        },
      ],
    },
  };
}

delete pluginPreset.watchPlugins;
delete pluginPreset.prettierPath;

module.exports = {
  projects: [
    nativeProject('expo-horizon-location', 'ios'),
    nativeProject('expo-horizon-location', 'android'),
    nativeProject('expo-horizon-notifications', 'ios'),
    {
      ...pluginPreset,
      displayName: 'plugins',
      roots: ['<rootDir>/expo-horizon-core/plugin', '<rootDir>/expo-horizon-notifications/plugin'],
    },
  ],
};
