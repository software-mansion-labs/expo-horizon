# The Quest push SDK calls these Horizon OS-provided classes. They intentionally
# are not packaged in the app; keep warning suppression scoped to the Quest flavor.
-dontwarn horizonos.supplement.hzplatformclientcore.AndroidHorizonPlatformConfig
-dontwarn horizonos.supplement.hzplatformclientcore.HorizonPlatformConfig
-dontwarn horizonos.supplement.hzplatformclientcore.HorizonPlatformCore
-dontwarn horizonos.supplement.hzplatformclientcore.HzPlatformCoreRuntimeException
-dontwarn horizonos.supplement.hzplatformclientcore.Message
