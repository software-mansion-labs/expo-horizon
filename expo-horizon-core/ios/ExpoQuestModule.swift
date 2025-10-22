import ExpoModulesCore

public class ExpoHorizonModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoHorizon")

        Constant("isHorioznDevice") {
            false
        }

        Constant("isHorioznBuild") {
            false
        }

        Constant("horizonAppId") {
            nil as String?
        }
    }
}
