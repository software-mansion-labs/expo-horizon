package expo.modules.horizon

import expo.modules.kotlin.exception.CodedException
import metavrx.os.MetaVrOsSdkVersion

internal object HorizonSdkVersion {
  fun current(): Int? = firstAvailableVersion(
    { metavr.os.Build.Version.getApiVersion() },
    // Earlier releases expose the same SDK number under the old API names.
    { horizonos.os.Build.HorizonOsSdk.getVersion() },
    { vros.os.VrosBuild.getSdkVersion() }
  )

  internal fun firstAvailableVersion(vararg readers: () -> Int): Int? {
    for (read in readers) {
      val version = try {
        read()
      } catch (_: NoClassDefFoundError) {
        continue
      } catch (_: NoSuchMethodError) {
        continue
      }
      if (version > 0) return version
    }
    return null
  }

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
