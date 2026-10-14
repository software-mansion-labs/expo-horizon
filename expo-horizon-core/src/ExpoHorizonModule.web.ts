import { registerWebModule, NativeModule } from 'expo';

class ExpoHorizonModule extends NativeModule {
  isHorizonDevice = false;

  isHorizonBuild = false;

  horizonAppId = null;

  readonly horizonSdkVersion: number | null = null;

  isHorizonSdkVersionAtLeast(version: number): boolean {
    if (!Number.isInteger(version) || version < 61 || version > 2147483647) {
      throw new RangeError('Horizon SDK version must be an integer between 61 and 2147483647.');
    }
    return false;
  }
}

export default registerWebModule(ExpoHorizonModule, 'ExpoHorizonModule');
