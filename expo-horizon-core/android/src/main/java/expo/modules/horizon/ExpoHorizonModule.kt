package expo.modules.horizon

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoHorizonModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoHorizon")

        Constant("isHorizonDevice") { Utilities.isHorizonDevice() }

        Constant("isHorizonBuild") { Config.isHorizonBuild }

        Constant("horizonAppId") {
            if (BuildConfig.META_HORIZON_APP_ID == "") null else BuildConfig.META_HORIZON_APP_ID
        }
    }
}
