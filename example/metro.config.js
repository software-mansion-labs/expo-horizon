const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo
config.watchFolders = [workspaceRoot];

// Block all node_modules except the example's own node_modules
config.resolver.blockList = [
  // Block nested node_modules in local packages
  /\/expo-quest\/node_modules\/.*/,
  /\/expo-quest-location\/node_modules\/.*/,
  /\/expo-quest-notifications\/node_modules\/.*/,
  // Block workspace root node_modules (but not example/node_modules)
  new RegExp(`^${path.resolve(workspaceRoot, 'node_modules')}/.*`),
];

// Only look for modules in the example's node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
];

// Disable hierarchical lookup to prevent Metro from looking in parent directories
config.resolver.disableHierarchicalLookup = true;

config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });

module.exports = config;
