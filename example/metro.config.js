const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo
config.watchFolders = [workspaceRoot];

// Block all node_modules except the example's own node_modules
config.resolver.blockList = [
  // Block nested node_modules in local packages
  /\/expo-horizon-core\/node_modules\/.*/,
  /\/expo-horizon-location\/node_modules\/.*/,
  /\/expo-horizon-notifications\/node_modules\/.*/,
  // Block workspace root node_modules (but not example/node_modules)
  new RegExp(`^${path.resolve(workspaceRoot, 'node_modules')}/.*`),
];

// Only look for modules in the example's node_modules
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Map local packages to their source files for live reloading
config.resolver.extraNodeModules = {
  'expo-horizon-core': path.resolve(workspaceRoot, 'expo-horizon-core'),
  'expo-horizon-location': path.resolve(workspaceRoot, 'expo-horizon-location'),
  'expo-horizon-notifications': path.resolve(workspaceRoot, 'expo-horizon-notifications'),
};

// Resolve to source files instead of built files for live reloading
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const localPackages = {
    'expo-horizon-core': path.resolve(workspaceRoot, 'expo-horizon-core/src/index.ts'),
    'expo-horizon-location': path.resolve(workspaceRoot, 'expo-horizon-location/src/index.ts'),
    'expo-horizon-notifications': path.resolve(
      workspaceRoot,
      'expo-horizon-notifications/src/index.ts'
    ),
  };

  // Check if this is one of our local packages
  if (localPackages[moduleName]) {
    return {
      filePath: localPackages[moduleName],
      type: 'sourceFile',
    };
  }

  // For subpaths like 'expo-horizon-core/something'
  for (const [pkgName, srcPath] of Object.entries(localPackages)) {
    if (moduleName.startsWith(`${pkgName}/`)) {
      const subPath = moduleName.substring(pkgName.length + 1);
      const pkgDir = path.dirname(srcPath);
      return {
        filePath: path.resolve(pkgDir, `${subPath}.ts`),
        type: 'sourceFile',
      };
    }
  }

  // Fallback to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

// Disable hierarchical lookup to prevent Metro from looking in parent directories
config.resolver.disableHierarchicalLookup = true;

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
