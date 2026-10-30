package expo.modules.horizon

import org.junit.Assert.assertFalse
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class HorizonSdkVersionTest {
  @Test
  fun returnsNullWhenHorizonOsVersionApisAreAbsent() {
    assertNull(HorizonSdkVersion.current())
  }

  @Test
  fun prefersTheCurrentApiWithoutCallingLegacyApis() {
    assertEquals(207, HorizonSdkVersion.firstAvailableVersion(
      { 207 },
      { error("Legacy API should not be called") }
    ))
  }

  @Test
  fun fallsBackWhenClassesOrMethodsAreMissing() {
    assertEquals(61, HorizonSdkVersion.firstAvailableVersion(
      { throw NoClassDefFoundError() },
      { throw NoSuchMethodError() },
      { 61 }
    ))
  }

  @Test
  fun doesNotExposeInvalidVersionNumbers() {
    assertNull(HorizonSdkVersion.firstAvailableVersion({ 0 }, { -1 }))
  }

  @Test
  fun doesNotHideUnexpectedErrors() {
    assertThrows(IllegalStateException::class.java) {
      HorizonSdkVersion.firstAvailableVersion({ error("Unexpected SDK failure") })
    }
  }

  @Test
  fun returnsFalseWhenHorizonOsClassesAreAbsent() {
    // Exercise the real Meta utility AAR on the JVM, where neither OS API exists.
    for (version in listOf(61.0, 70.0, 71.0, 207.0, Int.MAX_VALUE.toDouble())) {
      assertFalse(HorizonSdkVersion.isAtLeast(version))
    }
  }

  @Test
  fun returnsFalseForVersionsBelowTheCompatibilityLibraryMinimum() {
    for (version in listOf(1.0, 30.0, 60.0)) {
      assertFalse(HorizonSdkVersion.isAtLeast(version))
    }
  }

  @Test
  fun rejectsInvalidVersionsBeforeCallingTheSdk() {
    for (version in listOf(-1.0, 0.0, 60.5, 61.5, Double.NaN, Double.POSITIVE_INFINITY,
      Double.NEGATIVE_INFINITY, Int.MAX_VALUE.toDouble() + 1)) {
      assertThrows(InvalidHorizonSdkVersionException::class.java) {
        HorizonSdkVersion.isAtLeast(version)
      }
    }
  }
}
