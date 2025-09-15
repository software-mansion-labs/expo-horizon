const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");
const localPkgRoot = path.resolve(workspaceRoot, "expo-quest-location");

const config = getDefaultConfig(projectRoot);

// npm v7+ will install ../node_modules/react and ../node_modules/react-native because of peerDependencies.
// To prevent the incompatible react-native between ./node_modules/react-native and ../node_modules/react-native,
// excludes the one from the parent folder when bundling.
const existingBlockList = config.resolver.blockList;
const blockList = makeBlockList([
  ...(existingBlockList ? [existingBlockList] : []),
  // Exclude peer deps from the parent node_modules to avoid mismatched RN/React
  new RegExp(`${escapePath(path.join(localPkgRoot, "node_modules", "react"))}(/.*)?$`),
  new RegExp(`${escapePath(path.join(localPkgRoot, "node_modules", "react-native"))}(/.*)?$`),

  // Exclude test files from bundling
  /.*\/__tests__\/.*/,
  /.*\.(test|spec)\.(js|jsx|ts|tsx)$/,
]);

config.resolver.blockList = blockList;

config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
];

config.resolver.extraNodeModules = {
  "expo-quest-location": "../expo-quest-location",
};

config.watchFolders = [
  ...(config.watchFolders || []),
  workspaceRoot,
];

config.transformer.getTransformOptions = async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  });

module.exports = config;

// Helpers
function escapePath(p) {
  return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Combine many regexes into one (what exclusionList used to do)
function makeBlockList(regexes) {
  const source = regexes.map((r) => (r instanceof RegExp ? r.source : String(r))).join("|");
  return new RegExp(source);
}
