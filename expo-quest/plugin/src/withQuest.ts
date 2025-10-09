import {
  ConfigPlugin,
  withGradleProperties,
  withAndroidManifest,
} from "@expo/config-plugins";
import { withProhibitedPermissions } from "./withProhibitedPermissions";
import withCustomAndroidManifest from "./withCustomAndroidManifest";

type HorizonOptions = {
  questAppId?: string;
  defaultHeight?: string;
  defaultWidth?: string;
  supportedDevices?: string;
  disableVrHeadtracking?: boolean;
};

const USE_EXPERIMENTAL_PLUGIN = true;

const withQuest: ConfigPlugin<HorizonOptions> = (config, options = {}) => {

  config = withQuestAppId(config, options);

  if (process.env.EXPO_HORIZON) {
    if (USE_EXPERIMENTAL_PLUGIN) {
      config = withCustomAndroidManifest(config, options);
    } else {
      config = withQuestEnabled(config);
      config = withPanelSize(config, options);
      config = withSupportedDevices(config, options);
      config = withVrHeadtracking(config, options);
      config = withProhibitedPermissions(config);
    }
  }

  return config;
};

const withQuestEnabled: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "horizonEnabled",
      value: "true",
    });

    return config;
  });
};

const withQuestAppId: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withGradleProperties(config, (config) => {
    const questAppId = options.questAppId ?? "";

    config.modResults.push({
      type: "property",
      key: "questAppId",
      value: questAppId,
    });

    return config;
  });
};

const withPanelSize: ConfigPlugin<HorizonOptions> = (config, options = {}) => {
  return withAndroidManifest(config, (config) => {
    // Only add layout if at least one dimension is provided
    if (!options.defaultHeight && !options.defaultWidth) {
      return config;
    }

    const mainActivity =
      config.modResults.manifest?.application?.[0]?.activity?.find(
        (activity: any) => activity.$?.["android:name"] === ".MainActivity"
      ) as any;

    if (mainActivity) {
      if (!mainActivity.layout) {
        mainActivity.layout = [];
      }

      const layoutAttrs: any = {};
      if (options.defaultHeight) {
        layoutAttrs["android:defaultHeight"] = options.defaultHeight;
      }
      if (options.defaultWidth) {
        layoutAttrs["android:defaultWidth"] = options.defaultWidth;
      }

      mainActivity.layout.push({
        $: layoutAttrs,
      });
    }

    return config;
  });
};

const withSupportedDevices: ConfigPlugin<HorizonOptions> = (
  config,
  options = {}
) => {
  return withAndroidManifest(config, (config) => {
    // Only add meta-data if supportedDevices is explicitly provided
    if (!options.supportedDevices) {
      return config;
    }

    const application = config.modResults.manifest?.application?.[0];

    if (application) {
      if (!application["meta-data"]) {
        application["meta-data"] = [];
      }

      application["meta-data"].push({
        $: {
          "android:name": "com.oculus.supportedDevices",
          "android:value": options.supportedDevices,
        },
      });
    }

    return config;
  });
};

const withVrHeadtracking: ConfigPlugin<HorizonOptions> = (
  config,
  options = {}
) => {
  return withAndroidManifest(config, (config) => {
    // Add VR headtracking by default unless explicitly disabled
    if (options.disableVrHeadtracking === true) {
      return config;
    }

    const manifest = config.modResults.manifest;

    if (manifest) {
      if (!manifest["uses-feature"]) {
        manifest["uses-feature"] = [];
      }

      manifest["uses-feature"].push({
        $: {
          "android:name": "android.hardware.vr.headtracking",
          "android:required": "true",
          "android:version": "1",
        },
      } as any);
    }

    return config;
  });
};

export default withQuest;
