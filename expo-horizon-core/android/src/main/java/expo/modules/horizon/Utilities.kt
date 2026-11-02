package expo.modules.horizon

import android.content.Context
import expo.modules.core.utilities.VRUtilities
import metavrx.os.HorizonOsDetector

class Utilities {
  companion object {
    fun isHorizonDevice(context: Context?): Boolean {
      // The official detector checks OS features, independently of model branding.
      // Preserve detection on older Quest releases without those features.
      return (context != null && HorizonOsDetector.isOnHorizonOs(context)) || VRUtilities.isQuest()
    }
  }
}
