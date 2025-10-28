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
    }
}
