import { NativeModule, requireNativeModule } from "expo";

declare class ExpoHorizonModule extends NativeModule {
  /**
   * Returns true if the current device is a Quest device.
   */
  isHorizonDevice: boolean;

  /**
   * Returns true if the current build is a Quest build.
   */
  isHorizonBuild: boolean;

  /**
   * The Quest app ID configured via the config plugin. Returns null if not set.
   * Note: First check if you are on a Quest device using `isQuestDevice`.
   */
  horizonAppId: string | null;
}

export default requireNativeModule<ExpoHorizonModule>("ExpoHorizon");
