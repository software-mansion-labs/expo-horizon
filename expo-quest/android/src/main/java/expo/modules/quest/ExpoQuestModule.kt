package expo.modules.quest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoQuestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoQuest")

    Constant("isQuestDevice") {
      Utilities.isQuestDevice()
    }

    Constant("isQuestBuild") {
      Config.isQuestBuild
    }

    Constant("questAppId") {
      if (BuildConfig.META_QUEST_APP_ID == "") null else BuildConfig.META_QUEST_APP_ID
    }
  }
}
