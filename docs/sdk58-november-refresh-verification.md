# Expo SDK 58 November refresh verification

Validated on 2026-11-17 on `jtatar/sdk58-november-refresh`, based on Horizon
`ed77ad4c90af9eaa06d6a88803a0bbb3f741c5e3` (published 58.0.1), plus the changes
accompanying this report. Work used an isolated checkout. The primary checkout at
`ee222c64664961610a10a2a8d0440131126e807e`, including its uncommitted notification
and example configuration edits, was not included or modified.

## Selected versions and source

| Package                     | Published Horizon 58.0.1 baseline | Selected |
| --------------------------- | --------------------------------- | -------- |
| Expo                        | 58.0.21                           | 58.0.25  |
| Upstream expo-location      | 58.0.20                           | 58.0.22  |
| Upstream expo-notifications | 58.1.7                            | 58.1.9   |
| expo-constants              | 58.0.14                           | 58.0.16  |
| expo-task-manager           | 58.0.12                           | 58.0.14  |
| expo-modules-core           | 58.0.28                           | 58.1.0   |
| expo-modules-autolinking    | 58.0.16                           | 58.1.0   |
| @expo/image-utils           | 0.12.6                            | 0.12.7   |

There were four newer stable Expo releases and two each for location and
notifications. React Native remains 0.88.1, React 19.3.0, and expo-application
58.1.2. Other SDK-managed example dependencies follow Expo 58.0.25's
`bundledNativeModules.json`.

The pinned source is
[`80b8f0b45e9f08364cf849a299f4d523bb153552`](https://github.com/expo/expo/commit/80b8f0b45e9f08364cf849a299f4d523bb153552).
It contains all three selected package versions and matches the npm provenance
for Expo and location. Notifications 58.1.9 was published from
`1773068a2b7414a5579c1527e91158a011d89e1b`; its corresponding sources also match
the selected snapshot. The three downloaded npm tarballs passed SHA-512 integrity
checks; all common source files matched the pin (192 Expo, 137 location, 202
notifications files).

The Git tag named `expo@58.0.25` points to a snapshot whose Expo manifest still
says 58.0.19, so it was not used as the source of package versions. The resolver
also encounters the removed `packages/expo-module-scripts/package.json`. Versions
were read directly from the pinned manifests and published package metadata.
The public `expo-module-scripts@56.0.8` remains in use; upstream's private internal
scripts are not substituted.

The recorded previous Expo source is
`075c93fe58bb4f76316183ac7fdb005403475970`. The upstream checkout initially had
shallow history, causing the incremental helper's ancestry gate to reject it.
Fetching sufficient history established the ancestry without changing either
source revision. A separate clean sync rehearsal then reported only six expected
changelog/package/Gradle conflicts. These were resolved using the reviewed Horizon
metadata; all 27 other imported files matched the final implementation byte for
byte. `upstream-sync.json` records the validated target for subsequent syncs.
The original upstream checkout was not switched or edited. Temporary upstream
and sync-rehearsal worktrees were removed after validation.

## Changes and parity

- Location adds `/next` `Location.geocode` and `Location.reverseGeocode`, including
  the optional locale, types, native implementations, and upstream tests. The
  example exposes both operations for later manual and Quest checks.
- The legacy Android location consumer explicitly treats host resume as foreground
  when retrying service startup. The same fix is applied to the Quest consumer.
- Quest registers both new geocoding methods with the existing policy: reject with
  `ERR_QUEST_FEATURE_UNAVAILABLE`. Shared geocoding records and Android platform
  code add no Google Play Services dependency; Quest does not invoke the geocoder.
- Notifications has dependency-only upstream changes. Its native sources, JS
  implementation, and plugins are unchanged by this refresh.
- Both iOS trees match upstream byte for byte. Flattened Android notification
  sources match; location retains only its existing `isHorizon` constant and
  `Utilities.kt`, needed to expose Horizon detection in the mobile flavor too.
  The read-only parity helper therefore returns **1**, not a clean-zero result.
- Every TypeScript difference was reviewed: Horizon location detection,
  notification token type/detection, formatting, and the added geocoding forwarding
  tests. No other `/next` implementation drift remains. Plugin, manifest, ProGuard,
  podspec, and native dependency deltas were reviewed separately; no upstream
  changes in those areas were omitted. Android package version fields retain
  Horizon's coordinated version rather than the upstream versions.

All three Horizon packages are prepared as **58.1.0 (unreleased)** because this
adds public APIs. Release notes remain under `Unpublished`; upstream wording and
published history are preserved. The Quest restriction has its own note. Core and
example dependency changes have no additional user-facing release note. No dated
release, npm publication, remote tag, or merge was performed.

## Automated and native checks

Node 24.9.0 and Yarn 1.22.22 were used. The dependency update deliberately
regenerated the lockfile before validating a frozen install.

| Check                                                                | Result                                                                                                                                      |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `yarn install --frozen-lockfile --non-interactive`                   | Pass                                                                                                                                        |
| `yarn verify` (package/plugin builds, lint, formatting, types, Jest) | Pass: 24 suites, 201 tests passed, 1 skipped, 1 snapshot                                                                                    |
| `expo install --check`                                               | Pass                                                                                                                                        |
| `expo-doctor@1.21.5 example`                                         | Pass: 20/20 checks                                                                                                                          |
| Clean prebuild and repeated regeneration                             | Pass: four checked native configuration files were identical                                                                                |
| Android `assembleMobileDebug` and `assembleQuestDebug`, arm64-v8a    | Pass                                                                                                                                        |
| Core native JVM tests, mobile and Quest                              | Pass: 18 tests in 3 suites per flavor, no failures                                                                                          |
| iOS Debug simulator build, code signing disabled                     | Pass                                                                                                                                        |
| Merged Android manifests                                             | Pass: mobile retains background/motion permissions; Quest excludes them; both have foreground-service location and notification permissions |
| Quest panel manifest                                                 | Pass: 1024 × 640 dp default, 600 × 400 dp minimum; no mobile panel overlay                                                                  |
| Package dry-run contents                                             | Pass: all three package manifests and native/build/plugin outputs included; location includes new geocoding JS/types and native files       |

Android command from `example/android`:

```sh
./gradlew --no-daemon --console=plain \
  :app:assembleMobileDebug :app:assembleQuestDebug \
  :expo-horizon-core:testMobileDebugUnitTest \
  :expo-horizon-core:testQuestDebugUnitTest \
  -PreactNativeArchitectures=arm64-v8a
```

The iOS build used `expohorizondemo.xcworkspace`, scheme `expohorizondemo`, Debug,
`iphonesimulator`, and `CODE_SIGNING_ALLOWED=NO` after `pod install`.

Initial native builds were interrupted by overlapping prebuild regeneration:
this CLI cleared native directories even without `--clean`. After regeneration
and pod installation finished, both native builds were rerun successfully.
The first Quest compile also caught Kotlin inferring `Nothing` for the new
reject-only coroutine methods; explicit result and argument types fixed it.
The repeated-prebuild evidence proves equivalent regenerated configuration, not
an incremental edit preserving arbitrary native changes.

## Emulator and simulator runtime

The mobile Debug APK ran on a Pixel 9 Pro emulator, Android API 37, arm64, 16 KB
pages. The iOS app ran on an iPhone 18 Pro simulator, iOS 27.0. A temporary dev
harness called the actual native modules and captured callbacks; it did not mock
the bridge. Permission states and synthetic locations were set through adb and
simctl. The harness and its entry-point import were removed after testing.
Computer-use access to the simulator UI was rejected, so UI taps were not tested.

| Runtime check                                                   | Android emulator                                  | iOS simulator                                   |
| --------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------- |
| Non-Horizon device/build flags and unavailable OS/SDK constants | Pass                                              | Pass                                            |
| Denied legacy position request                                  | `ERR_LOCATION_UNAUTHORIZED`                       | `ERR_DENIED_FOREGROUND_LOCATION_PERMISSION`     |
| Denied `/next` position request                                 | `ERR_FOREGROUND_LOCATION_PERMISSIONS_NOT_GRANTED` | `ERR_MISSING_PERMISSIONS`                       |
| Granted legacy current/last-known and `/next` position          | Valid fixes                                       | Valid fixes                                     |
| `/next` forward geocoding, explicit and default locale          | Pass                                              | Pass                                            |
| `/next` reverse geocoding with Polish locale                    | Localized address returned                        | Localized address returned                      |
| Invalid reverse-geocoding coordinates                           | `ERR_INVALID_COORDINATES`                         | `ERR_INVALID_COORDINATES`                       |
| Legacy and `/next` watchers                                     | Callbacks received; no errors                     | Callbacks received; no errors                   |
| Watch disposal followed by another injected location            | Counts unchanged                                  | Counts unchanged                                |
| Local scheduled notification                                    | Receipt callback and presented identifier match   | Receipt callback and presented identifier match |
| Notification dismissal/cancellation and clearing last response  | Empty queues and null response                    | Empty queues and null response                  |

Android's legacy task service was started with a foreground notification, then the
app was backgrounded and its process killed without force-stopping registration.
After relaunch, the PID changed, `isForeground=true` and `startRequested=true`
returned, and the registered task delivered 12 callbacks without errors. Stopping
tracking returned `hasStartedLocationUpdatesAsync=false` and removed foreground
status (`startRequested=false`); the service can remain bound. This verifies
recovery after process death on this emulator, not every OEM lifecycle condition.
The `/next` background session separately transitioned from `PROMOTED` to
`NOT_RUNNING` on stop.

## Remaining validation

- Physical Quest tests are deferred at the user's request: device detection,
  foreground service behavior, both new unavailable-feature errors, notifications,
  and panel sizing still need headset testing. Quest compilation/JVM tests do not
  establish these results.
- Notification taps, response callbacks after a real tap, background/cold-launch
  notification flows, and navigation-driven watcher cleanup were not exercised.
  Clearing a null last response is not a successful tap test.
- Real FCM/APNs/Horizon push registration and delivery require platform credentials
  and remain unverified. No remote push was sent. The unsigned iOS simulator build
  logged a missing-Keychain-entitlement error while reading persisted server
  registration info; this did not prevent the local notification checks.
- The imported Swift unit tests were not run through XCTest. Legacy iOS geocoder
  fallback on older iOS versions, long-running background tracking, geofencing,
  optimized Quest release/R8, and physical-device behavior were not validated.

Detailed logs, native build outputs, integrity checks, manifest results, and
runtime JSON are stored outside Git in the local release-evidence directory
`2026-11-17-refresh`. This report contains no device coordinates or push tokens.
