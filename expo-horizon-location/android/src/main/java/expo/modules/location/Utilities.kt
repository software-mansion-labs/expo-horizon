package expo.modules.location
import expo.modules.core.utilities.VRUtilities

class Utilities {
  companion object {
    fun isHorizonDevice(): Boolean {
      return VRUtilities.isQuest();
    }
  }
}
