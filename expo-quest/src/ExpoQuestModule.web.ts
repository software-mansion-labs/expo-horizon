import { registerWebModule, NativeModule } from 'expo';

class ExpoQuestModule extends NativeModule {
  isQuestDevice = false;

  isQuestBuild = false;

  questAppId = null;
}

export default registerWebModule(ExpoQuestModule, 'ExpoQuestModule');
