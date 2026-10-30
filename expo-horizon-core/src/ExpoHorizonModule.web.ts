import { registerWebModule, NativeModule, CodedError } from 'expo';

class ExpoHorizonModule extends NativeModule {
  isHorizonDevice = false;

  isHorizonBuild = false;

  horizonAppId = null;

  readonly horizonSdkVersion: number | null = null;

  readonly horizonOsVersion: string | null = null;

  isHorizonSdkVersionAtLeast(_version: number): boolean {
    throw new CodedError(
      'ERR_HORIZON_SDK_UNAVAILABLE',
      'Horizon OS SDK checks are only available on Android.'
    );
  }
}

export default registerWebModule(ExpoHorizonModule, 'ExpoHorizonModule');
