package expo.modules.horizon

import expo.modules.kotlin.exception.CodedException
import metavrx.os.MetaVrOsSdkVersion

internal object HorizonSdkVersion {
  fun isAtLeast(version: Double): Boolean {
    if (!version.isFinite() || version < 61 || version > Int.MAX_VALUE || version % 1.0 != 0.0) {
      throw InvalidHorizonSdkVersionException()
    }

    // Meta's compatibility library returns false when the OS APIs are absent.
    // Versions below 61 are rejected because the library cannot safely check them.
    return MetaVrOsSdkVersion.isAtOrAbove(version.toInt())
  }
}

internal class InvalidHorizonSdkVersionException : CodedException(
  "Horizon SDK version must be an integer between 61 and 2147483647."
)
