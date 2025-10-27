import {
  ConfigPlugin,
  withDangerousMod,
  withAppBuildGradle,
  AndroidConfig,
} from '@expo/config-plugins';
import * as fs from 'fs';
import * as path from 'path';

import { PROHIBITED_PERMISSIONS } from './constants';

type HorizonManifestOptions = {
  horizonAppId?: string;
  defaultHeight?: string;
  defaultWidth?: string;
  supportedDevices?: string;
  disableVrHeadtracking?: boolean;
  allowBackup?: boolean;
};

/**
 * Creates a separate AndroidManifest.xml for the Horizon flavor.
 * This plugin uses withDangerousMod to directly manipulate files and
 * modifies the app build.gradle to add flavor dimensions.
 */
export const withCustomAndroidManifest: ConfigPlugin<HorizonManifestOptions> = (
  config,
  options = {}
) => {
  // Add flavor dimensions to build.gradle
  config = withQuestFlavorDimensions(config);

  // Create Horizon-specific AndroidManifest
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidRoot = path.join(projectRoot, 'android');

      // Path to the quest flavor AndroidManifest.xml
      const questManifestDir = path.join(androidRoot, 'app', 'src', 'quest');
      const questManifestPath = path.join(questManifestDir, 'AndroidManifest.xml');

      try {
        // Ensure the quest directory exists
        if (!fs.existsSync(questManifestDir)) {
          fs.mkdirSync(questManifestDir, { recursive: true });
        }

        // Create a minimal Horizon manifest with only Horizon-specific additions
        // This prevents conflicts during manifest merging
        const questManifest = createQuestManifest(options);

        // Write the Horizon AndroidManifest
        await AndroidConfig.Manifest.writeAndroidManifestAsync(questManifestPath, questManifest);

        console.log(`✅ Created Horizon-specific AndroidManifest at: ${questManifestPath}`);
      } catch (error) {
        console.error('Error creating Quest AndroidManifest:', error);
        throw error;
      }

      return config;
    },
  ]);

  return config;
};

/**
 * Adds flavor dimensions to the app build.gradle
 */
const withQuestFlavorDimensions: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Check if flavor dimensions already exist
    if (buildGradle.includes('flavorDimensions') && buildGradle.includes('productFlavors')) {
      console.log('⚠️  Flavor dimensions already exist in build.gradle');
      return config;
    }

    // Find the android block
    const androidBlockRegex = /android\s*{/;
    const match = buildGradle.match(androidBlockRegex);

    if (!match) {
      console.warn('⚠️  Could not find android block in build.gradle');
      return config;
    }

    const flavorConfig = `
    flavorDimensions += "device"
    productFlavors {
        mobile { dimension "device" }
        quest { dimension "device" }
    }
`;

    // Insert after the android block opening
    const insertPosition = match.index! + match[0].length;
    config.modResults.contents =
      buildGradle.slice(0, insertPosition) + flavorConfig + buildGradle.slice(insertPosition);

    console.log('✅ Added flavor dimensions to app build.gradle');

    return config;
  });
};

/**
 * Creates a Horizon-specific AndroidManifest with only Horizon additions.
 * This manifest will be merged with the main manifest, so we only include
 * Horizon-specific features to avoid conflicts.
 */
function createQuestManifest(
  options: HorizonManifestOptions
): AndroidConfig.Manifest.AndroidManifest {
  const manifest: AndroidConfig.Manifest.AndroidManifest = {
    manifest: {
      $: {
        'xmlns:android': 'http://schemas.android.com/apk/res/android',
        'xmlns:tools': 'http://schemas.android.com/tools',
      },
      queries: [],
      'uses-permission': [],
      'uses-feature': [],
      application: [],
    },
  };

  // Block prohibited permissions
  for (const permission of PROHIBITED_PERMISSIONS) {
    const fullPermissionName = permission.includes('.')
      ? permission
      : `android.permission.${permission}`;

    manifest.manifest['uses-permission']!.push({
      $: {
        'android:name': fullPermissionName,
        'tools:node': 'remove',
      },
    } as any);
  }

  console.log(
    `🚫 Blocked ${PROHIBITED_PERMISSIONS.length} prohibited permissions in Horizon manifest`
  );

  // Add VR headtracking feature (unless disabled)
  if (options.disableVrHeadtracking !== true) {
    manifest.manifest['uses-feature']!.push({
      $: {
        'android:name': 'android.hardware.vr.headtracking',
        'android:required': 'true',
        'android:version': '1',
      },
    } as any);
  }

  // Create application node with only Horizon-specific additions
  const application: any = {
    $: {
      // Default to false for Horizon (disabled by default for security, recommended by Meta)
      // User can enable with allowBackup: true option
      'android:allowBackup': String(options.allowBackup ?? false),
      // Tell the manifest merger to replace the `allowBackup` value from main manifest
      'tools:replace': 'android:allowBackup',
    },
    'meta-data': [],
    activity: [],
  };

  // Add supported devices meta-data
  if (options.supportedDevices) {
    application['meta-data'].push({
      $: {
        'android:name': 'com.oculus.supportedDevices',
        'android:value': options.supportedDevices,
      },
    });
  }

  // Add MainActivity with panel size
  if (options.defaultHeight || options.defaultWidth) {
    const layoutAttrs: any = {};
    if (options.defaultHeight) {
      layoutAttrs['android:defaultHeight'] = options.defaultHeight;
    }
    if (options.defaultWidth) {
      layoutAttrs['android:defaultWidth'] = options.defaultWidth;
    }

    application.activity.push({
      $: {
        'android:name': '.MainActivity',
      },
      layout: [
        {
          $: layoutAttrs,
        },
      ],
    });
  }

  manifest.manifest.application!.push(application);

  return manifest;
}

export default withCustomAndroidManifest;
