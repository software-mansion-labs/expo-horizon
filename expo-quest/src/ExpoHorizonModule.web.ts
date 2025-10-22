import { registerWebModule, NativeModule } from "expo";

class ExpoHorizonModule extends NativeModule {
  isQuestDevice = false;

  isQuestBuild = false;

  questAppId = null;
}

export default registerWebModule(ExpoHorizonModule, "ExpoHorizonModule");
