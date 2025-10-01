package expo.modules.quest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import expo.modules.quest.BuildConfig

class ExpoQuestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoQuest")

    Constant("isQuestDevice") {
      Utilities.isQuestDevice()
    }

    Constant("questAppId") {
      if (BuildConfig.META_QUEST_APP_ID == "") null else BuildConfig.META_QUEST_APP_ID
    }
  }
}
