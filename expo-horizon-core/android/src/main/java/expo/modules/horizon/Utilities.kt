package expo.modules.horizon

import expo.modules.core.utilities.VRUtilities

class Utilities {
  companion object {
    fun isHorizonDevice(): Boolean {
      return VRUtilities.isQuest();
    }
  }
}
