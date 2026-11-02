package expo.modules.horizon

internal object HorizonOsVersion {
  fun current(): String? = firstAvailableVersion(
    { metavr.os.Build.Version.getDisplayName() },
    { horizonos.os.Build.Version.getDisplayName() }
  )

  internal fun firstAvailableVersion(vararg readers: () -> String?): String? {
    for (read in readers) {
      val version = try {
        read()
      } catch (_: NoClassDefFoundError) {
        continue
      } catch (_: NoSuchMethodError) {
        continue
      }
      // This is an opaque display label; preserve it without parsing or normalizing.
      if (!version.isNullOrBlank()) return version
    }
    return null
  }
}
