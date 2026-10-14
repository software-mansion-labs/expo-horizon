package expo.modules.horizon

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class HorizonOsVersionTest {
  @Test
  fun returnsNullWhenHorizonOsClassesAreAbsent() {
    assertNull(HorizonOsVersion.current())
  }

  @Test
  fun preservesTheDisplayLabelWithoutParsingOrCallingLegacyApis() {
    assertEquals("  bananas.hotfix7  ", HorizonOsVersion.firstAvailableVersion(
      { "  bananas.hotfix7  " },
      { error("Legacy API should not be called") }
    ))
  }

  @Test
  fun fallsBackWhenTheCurrentClassOrMethodIsMissing() {
    for (missingApi in listOf(NoClassDefFoundError(), NoSuchMethodError())) {
      assertEquals("2.1", HorizonOsVersion.firstAvailableVersion(
        { throw missingApi }, { "2.1" }
      ))
    }
  }

  @Test
  fun returnsNullWhenNoDisplayLabelIsAvailable() {
    assertNull(HorizonOsVersion.firstAvailableVersion({ null }, { "" }, { "  " }))
  }

  @Test
  fun doesNotHideUnexpectedErrors() {
    assertThrows(IllegalStateException::class.java) {
      HorizonOsVersion.firstAvailableVersion({ error("Unexpected SDK failure") })
    }
  }
}
