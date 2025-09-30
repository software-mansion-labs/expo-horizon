import { NativeModule, requireNativeModule } from 'expo';

declare class ExpoQuestModule extends NativeModule {
  isQuestDevice: boolean;
}

export default requireNativeModule<ExpoQuestModule>('ExpoQuest');
