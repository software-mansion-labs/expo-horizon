const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Resolve the local `expo-horizon-*` packages from their built output in this app's own
// `node_modules`, keeping Metro inside `projectRoot`. Resolving them from the monorepo root
// instead triggers "Failed to get the SHA-1" errors on machines without watchman. Trade-off:
// pick up package source edits with `yarn install` here, not via live reload.
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

// Block the nested node_modules inside the local packages so React / React Native / Expo are
// not bundled twice.
config.resolver.blockList = [
  /\/expo-horizon-core\/node_modules\/.*/,
  /\/expo-horizon-location\/node_modules\/.*/,
  /\/expo-horizon-notifications\/node_modules\/.*/,
];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
