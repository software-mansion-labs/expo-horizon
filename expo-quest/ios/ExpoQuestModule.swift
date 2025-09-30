import ExpoModulesCore

public class ExpoQuestModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoQuest")

    Constant("isQuestDevice") {
      false
    }
  }
}
