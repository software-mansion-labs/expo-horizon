package expo.modules.location

import expo.modules.kotlin.exception.CodedException

// --- Horizon (Meta Quest) specific exceptions

internal class LocationManagerUnavailable :
  CodedException("Location manager is unavailable")

internal class QuestFeatureUnavailableException(
  message: String = "This feature is not supported on Meta Quest devices. Please use a supported device to access this functionality."
) : CodedException(message)

internal class QuestBuildVariantException :
  CodedException("This feature is not available in the Quest build variant. To enable this feature on non-Quest devices, please use the questDebug / questRelease build variants and rebuild your app.")
