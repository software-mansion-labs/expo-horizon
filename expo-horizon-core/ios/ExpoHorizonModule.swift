import ExpoModulesCore

public class ExpoHorizonModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoHorizon")

        Constant("isHorizonDevice") {
            false
        }

        Constant("isHorizonBuild") {
            false
        }

        Constant("horizonAppId") {
            nil as String?
        }

        Constant("horizonSdkVersion") {
            nil as Int?
        }

        Constant("horizonOsVersion") {
            nil as String?
        }

        Function("isHorizonSdkVersionAtLeast") { (_: Double) -> Bool in
            false
        }
    }
}
