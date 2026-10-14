import { registerWebModule, NativeModule } from 'expo';

class ExpoHorizonModule extends NativeModule {
  isHorizonDevice = false;

  isHorizonBuild = false;

  horizonAppId = null;

  readonly horizonSdkVersion: number | null = null;

  readonly horizonOsVersion: string | null = null;

  isHorizonSdkVersionAtLeast(_version: number): boolean {
    return false;
  }
}

export default registerWebModule(ExpoHorizonModule, 'ExpoHorizonModule');
