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

        Function("isHorizonSdkVersionAtLeast") { (_: Double) throws -> Bool in
            throw HorizonSdkUnavailableException()
        }
    }
}

private final class HorizonSdkUnavailableException: Exception, @unchecked Sendable {
    override var reason: String {
        "Horizon OS SDK checks are only available on Android."
    }
}
