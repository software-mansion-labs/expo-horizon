package expo.modules.quest

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL

class ExpoQuestModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoQuest")

    Constant("isQuestDevice") {
      Utilities.isQuestDevice()
    }
  }
}
