import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoHorizonModule extends NativeModule {
  /**
   * Returns true if the current device is a Horizon device.
   */
  isHorizonDevice: boolean;

  /**
   * Returns true if the current build is a Horizon build.
   */
  isHorizonBuild: boolean;

  /**
   * The Horizon app ID configured via the config plugin. Returns null if not set.
   * Note: First check if you are on a Horizon device using `isHorizonDevice`.
   */
  horizonAppId: string | null;
}

export default requireNativeModule<ExpoHorizonModule>('ExpoHorizon');
