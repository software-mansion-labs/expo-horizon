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

        Function("isHorizonSdkVersionAtLeast") { (version: Double) -> Bool in
            guard version.isFinite,
                  version >= 61,
                  version <= 2147483647,
                  version.rounded(.towardZero) == version else {
                throw InvalidHorizonSdkVersionException()
            }
            return false
        }
    }
}

private final class InvalidHorizonSdkVersionException: Exception {
    override var reason: String {
        "Horizon SDK version must be an integer between 61 and 2147483647."
    }
}
