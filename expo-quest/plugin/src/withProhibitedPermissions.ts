import { ConfigPlugin, withAndroidManifest } from "@expo/config-plugins";
import { PROHIBITED_PERMISSIONS } from "./constants";

/**
 * Config plugin that removes prohibited Android permissions from the manifest
 * when building for devices running Meta Horizon OS.
 */
export const withProhibitedPermissions: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest) {
      return config;
    }

    // Get current uses-permission entries
    const usesPermissions = manifest["uses-permission"];

    if (!usesPermissions || !Array.isArray(usesPermissions)) {
      return config;
    }

    // Filter out prohibited permissions
    manifest["uses-permission"] = usesPermissions.filter((permission: any) => {
      const permissionName = permission.$?.["android:name"];

      if (!permissionName) {
        return true;
      }

      // Extract the permission name without the android.permission prefix
      const shortName = permissionName.replace("android.permission.", "");

      // Keep the permission if it's not in the prohibited list
      return !PROHIBITED_PERMISSIONS.includes(shortName);
    });

    return config;
  });
};

export default withProhibitedPermissions;
