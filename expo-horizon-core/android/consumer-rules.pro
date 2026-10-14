# These APIs are supplied by Horizon OS, not bundled into the APK. Meta's utility
# and our version reader handle missing APIs on older OS and other Android devices.
-dontwarn metavr.os.Build$Version
-dontwarn horizonos.os.Build$HorizonOsSdk
-dontwarn vros.os.VrosBuild
