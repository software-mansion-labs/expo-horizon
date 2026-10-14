package expo.modules.horizon

import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Test

class HorizonSdkVersionTest {
  @Test
  fun returnsFalseWhenHorizonOsClassesAreAbsent() {
    // Exercise the real Meta utility AAR on the JVM, where neither OS API exists.
    for (version in listOf(61.0, 70.0, 71.0, 207.0, Int.MAX_VALUE.toDouble())) {
      assertFalse(HorizonSdkVersion.isAtLeast(version))
    }
  }

  @Test
  fun rejectsUnsupportedAndNonIntegerVersionsBeforeCallingTheSdk() {
    for (version in listOf(-1.0, 0.0, 60.0, 61.5, Double.NaN, Double.POSITIVE_INFINITY,
      Double.NEGATIVE_INFINITY, Int.MAX_VALUE.toDouble() + 1)) {
      assertThrows(InvalidHorizonSdkVersionException::class.java) {
        HorizonSdkVersion.isAtLeast(version)
      }
    }
  }
}
