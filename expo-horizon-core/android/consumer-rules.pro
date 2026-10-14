# These APIs are supplied by Horizon OS, not bundled into the APK. Meta's utility
# catches NoClassDefFoundError to support older OS versions and other Android devices.
-dontwarn horizonos.os.Build$HorizonOsSdk
-dontwarn vros.os.VrosBuild
