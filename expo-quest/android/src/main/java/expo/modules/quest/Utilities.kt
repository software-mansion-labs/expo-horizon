package expo.modules.quest

import android.os.Build

class Utilities {
  companion object {
    fun isQuestDevice(): Boolean {
      return (Build.MANUFACTURER.equals("Oculus", ignoreCase = true) || Build.MANUFACTURER.equals("Meta", ignoreCase = true)) && Build.MODEL.contains("Quest")
    }
  }
}
