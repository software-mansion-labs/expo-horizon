import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoHorizonModule extends NativeModule {
  /**
   * Returns true when Horizon OS is detected, with a fallback for older Quest devices.
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

  /**
   * The device's current Meta VR OS SDK version, independent of Android's API level
   * and the app's build flavor. Returns null when the OS version API is unavailable,
   * including on non-Horizon Android, iOS, and web.
   */
  readonly horizonSdkVersion: number | null;

  /**
   * The user-facing Horizon OS version string, or null when unavailable.
   * Treat this as an opaque display label; use horizonSdkVersion for comparisons.
   * Returns null on non-Horizon Android, iOS, and web.
   */
  readonly horizonOsVersion: string | null;

  /**
   * Whether the device supports at least the given Meta VR OS SDK version.
   * This is independent of Android's API level and the app's build flavor.
   * On Android, returns false for versions 1–60, non-Horizon devices, or unavailable SDKs.
   * @throws ERR_HORIZON_SDK_UNAVAILABLE on iOS and web.
   * @throws On Android, if version is not an integer between 1 and 2147483647.
   */
  isHorizonSdkVersionAtLeast(version: number): boolean;
}

export default requireNativeModule<ExpoHorizonModule>('ExpoHorizon');
