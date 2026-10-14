package expo.modules.horizon

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowBuild

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], manifest = Config.NONE)
class UtilitiesTest {
  private val context get() = RuntimeEnvironment.getApplication()

  @Before
  fun resetDevice() {
    ShadowBuild.setManufacturer("Other manufacturer")
    ShadowBuild.setModel("Other model")
    shadowOf(context.packageManager).setSystemFeature("horizonos.software.horizon_os", false)
    shadowOf(context.packageManager).setSystemFeature("oculus.hardware.standalone_vr", false)
  }

  @Test
  fun detectsHorizonOsWithoutQuestModelBranding() {
    shadowOf(context.packageManager).setSystemFeature("horizonos.software.horizon_os", true)
    assertTrue(Utilities.isHorizonDevice(context))
  }

  @Test
  fun detectsTheOlderStandaloneVrFeature() {
    shadowOf(context.packageManager).setSystemFeature("oculus.hardware.standalone_vr", true)
    assertTrue(Utilities.isHorizonDevice(context))
  }

  @Test
  fun preservesQuestDetectionWhenOsFeaturesAreAbsent() {
    ShadowBuild.setManufacturer("Oculus")
    ShadowBuild.setModel("Quest")
    assertTrue(Utilities.isHorizonDevice(context))
  }

  @Test
  fun doesNotTreatOtherAndroidDevicesAsHorizon() {
    assertFalse(Utilities.isHorizonDevice(context))
  }

  @Test
  fun canUseTheLegacyFallbackWithoutAReactContext() {
    assertFalse(Utilities.isHorizonDevice(null))
    ShadowBuild.setManufacturer("Meta")
    ShadowBuild.setModel("Quest 3")
    assertTrue(Utilities.isHorizonDevice(null))
  }
}
