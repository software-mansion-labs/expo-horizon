const pluginPreset = { ...require('expo-module-scripts/jest-preset-plugin') };
const path = require('path');

function nativeProject(packageName, platform) {
  const preset = { ...require(`jest-expo/${platform}/jest-preset`) };
  delete preset.watchPlugins;
  delete preset.passWithNoTests;
  return {
    ...preset,
    displayName: `${packageName}/${platform}`,
    rootDir: path.join(__dirname, packageName),
    roots: ['<rootDir>/src'],
    setupFilesAfterEnv: [path.join(__dirname, 'tests/jest-native-setup.js')],
    transformIgnorePatterns: preset.transformIgnorePatterns.map((pattern) =>
      pattern.replace('(?!(.pnpm|', '(?!(jest-expo|.pnpm|')
    ),
  };
}

delete pluginPreset.watchPlugins;
delete pluginPreset.prettierPath;
delete pluginPreset.passWithNoTests;

module.exports = {
  projects: [
    nativeProject('expo-horizon-core', 'web'),
    nativeProject('expo-horizon-location', 'ios'),
    nativeProject('expo-horizon-location', 'android'),
    nativeProject('expo-horizon-notifications', 'ios'),
    {
      ...pluginPreset,
      displayName: 'plugins',
      // Keep plugin tests on Babel: the upstream SWC export plugin is incompatible
      // with the SWC runtime shipped by this SDK's module scripts.
      transform: {
        '^.+\\.[jt]sx?$': [
          require.resolve('babel-jest', { paths: [require.resolve('jest-expo/package.json')] }),
          {
            babelrc: false,
            configFile: false,
            presets: [require.resolve('expo/internal/babel-preset')],
          },
        ],
      },
      roots: [
        '<rootDir>/expo-horizon-core/plugin',
        '<rootDir>/expo-horizon-location/plugin',
        '<rootDir>/expo-horizon-notifications/plugin',
      ],
    },
  ],
};
