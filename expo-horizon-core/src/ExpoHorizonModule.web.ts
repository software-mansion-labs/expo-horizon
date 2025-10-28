import { registerWebModule, NativeModule } from 'expo';

class ExpoHorizonModule extends NativeModule {
  isHorizonDevice = false;

  isHorizonBuild = false;

  horizonAppId = null;
}

export default registerWebModule(ExpoHorizonModule, 'ExpoHorizonModule');
