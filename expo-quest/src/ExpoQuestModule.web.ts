import { registerWebModule, NativeModule } from 'expo';

class ExpoQuestModule extends NativeModule {
  isQuestDevice = false;
}

export default registerWebModule(ExpoQuestModule, 'ExpoQuestModule');
