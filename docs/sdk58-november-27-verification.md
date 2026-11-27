# Expo SDK 58 refresh and 58.1.0 preparation — 2026-11-27

This continues `jtatar/sdk58-november-refresh` from
`65242959a2995d3e65abd07abb2d1b0804c2bc45`, which contains the
[November 17 refresh](sdk58-november-refresh-verification.md). The source includes
that commit plus the changes accompanying this report. The primary checkout's
uncommitted notification-token and example configuration edits were excluded and
left untouched. The worktree used is `expo-horizon-sdk58-refresh`.

## Version and release state

| Package                     | Prepared November 17 | Selected November 27 |
| --------------------------- | -------------------- | -------------------- |
| Expo                        | 58.0.25              | 58.1.0               |
| Upstream expo-location      | 58.0.22              | 58.0.23              |
| Upstream expo-notifications | 58.1.9               | 58.1.10              |
| expo-modules-core           | 58.1.0               | 58.2.0               |
| expo-router                 | 58.0.31              | 58.0.33              |
| expo-splash-screen          | 58.0.14              | 58.0.15              |
| jest-expo                   | 58.0.14              | 58.0.16              |

Two stable Expo releases and one each for location and notifications appeared
since the previous check. React Native remains 0.88.1, React 19.3.0,
expo-application 58.1.2, expo-constants 58.0.16, expo-task-manager 58.0.14, and
expo-modules-autolinking 58.1.0. SDK-managed dependencies follow the selected Expo
release's `bundledNativeModules.json`; the lockfile was deliberately regenerated.

All three Horizon packages still have **58.0.1** as their latest published stable
SDK 58 version. Preparation reused the existing **58.1.0** manual bump, moved the
reviewed notes into the dated 2026-11-27 release sections, and updated compatibility
rows. Core's SDK-facing dependency changes have no additional user-facing release
note. This is local preparation; no npm package, remote tag, PR, or merge was
created. Physical Quest verification remains a release prerequisite.

## Pinned source and implementation

All three selected upstream packages were published from SDK 58 commit
[`aa54ffb9c66e63043a61a10198ec7a003c2bd825`](https://github.com/expo/expo/commit/aa54ffb9c66e63043a61a10198ec7a003c2bd825),
confirmed by their npm provenance. Downloaded tarballs passed SHA-512 integrity
checks, and every common source file compared matched this pin: 196 Expo files,
143 location files, and 210 notification files.

The sync used the recorded baseline
`80b8f0b45e9f08364cf849a299f4d523bb153552`. The preview and apply covered all 11
upstream changed files. Six metadata/changelog conflicts were resolved by retaining
Horizon's coordinated version and published history, then importing new upstream
notes verbatim. No native or TypeScript merge conflicts remained.

- Android mobile location now uses a concurrent set for motion watch IDs, avoiding
  modification-during-iteration crashes in the activity receiver.
- **Quest adaptation:** the legacy `removeWatchAsync` implementation no longer
  requires foreground location permission. Cleanup can be requested even after
  permission is lost. This applies the same upstream behavior to Quest's separate
  location implementation; `/next` watcher disposal is unchanged.
- `getMotionActivityAsync({ timeout })` accepts a positive finite timeout in
  milliseconds and rejects with `ERR_LOCATION_MOTION_ACTIVITY_TIMEOUT` if no
  activity arrives. Invalid values reject with `ERR_LOCATION_INVALID_TIMEOUT`.
  The example uses ten seconds. Quest motion activity remains unsupported and its
  native unavailable error is preserved; no Google Play Services motion receiver
  is added to Quest.
- iOS `/next` watcher/task position payloads explicitly include `null` for
  unavailable fields instead of omitting keys.
- iOS notification permission requests handle `UNError.notificationsNotAllowed`
  by returning the current permission response, including for “Designed for iPad”
  apps running on Apple Silicon Macs.
- Expo's runtime/build fixes, including its updated modules core, are consumed as
  dependencies. No additional Horizon core implementation change was necessary.

Both iOS trees and Android mobile notifications match the pinned source byte for
byte. Android mobile location retains its existing `isHorizon` constant and
`Utilities.kt` detection helper. The parity tool therefore returns **1** for that
reviewed extension. TypeScript drift consists of Horizon detection/token types,
formatting, and the additional geocoding/motion tests. Plugins, manifests, ProGuard,
podspecs, and Gradle configuration were reviewed separately; there are no omitted
upstream changes in those areas.

The version resolver still encounters the removed upstream
`packages/expo-module-scripts/package.json`; versions were read from pinned
manifests and published metadata. Public `expo-module-scripts@56.0.8` is retained.
The original upstream checkout was not switched or edited, and its temporary
worktree was removed. The initial fetch reported an unrelated absent submodule;
the requested commit and its verified ancestor history were fetched successfully.

## Verification

Tools: Node 24.9.0, Yarn 1.22.22, Java 17.0.21, Xcode 27.2 (27B52), and
expo-doctor 1.21.5. Native builds used regenerated projects and the installed
frozen dependency graph.

| Check                                                             | Result                                                                                                                                  |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen install                                                    | Pass                                                                                                                                    |
| `yarn verify`                                                     | Pass: builds, plugins, lint, formatting, types; 26 Jest suites, 219 passed tests, 1 skipped, 1 snapshot                                 |
| Release guardrail tests                                           | Pass: 18 tests                                                                                                                          |
| `RELEASE_BUMP=minor node scripts/release.mjs prepare` and `check` | Pass; reused 58.1.0 against the complete published 58.0.1 baseline                                                                      |
| Repeat release preparation and formatting                         | Pass; no second bump or duplicated notes                                                                                                |
| `expo install --check` / Expo Doctor                              | Pass / 20 of 20 checks passed                                                                                                           |
| Clean prebuild and repeat regeneration                            | Pass; five checked configuration files identical                                                                                        |
| Android mobileDebug and questDebug, arm64-v8a                     | Both built successfully                                                                                                                 |
| Core native JVM tests                                             | 18 tests in 3 suites per flavor; no failures                                                                                            |
| iOS Debug simulator build                                         | Pass, with signing disabled                                                                                                             |
| Native source parity                                              | Reviewed location extension only; no unexpected drift                                                                                   |
| Merged manifests                                                  | Mobile retains background/motion permissions; Quest excludes them; both retain foreground-service location and notification permissions |
| Quest panel configuration                                         | 1024 × 640 dp default, 600 × 400 dp minimum; no mobile overlay                                                                          |
| Package dry-run contents                                          | All three packages include their expected JS, declarations, plugin and native sources                                                   |

Prebuild repetitions completed before starting native builds. This CLI regenerates
native directories even without `--clean`; the comparison proves equivalent
regenerated configuration, not preservation of arbitrary native edits.

Android builds used:

```sh
./gradlew --no-daemon --console=plain \
  :app:assembleMobileDebug :app:assembleQuestDebug \
  :expo-horizon-core:testMobileDebugUnitTest \
  :expo-horizon-core:testQuestDebugUnitTest \
  -PreactNativeArchitectures=arm64-v8a
```

The iOS build used `expohorizondemo.xcworkspace`, scheme `expohorizondemo`, Debug,
`iphonesimulator`, and `CODE_SIGNING_ALLOWED=NO`, after `pod install`.

## Runtime results

The mobile APK ran on the Pixel 9 Pro Android API 37 emulator (arm64, 16 KB pages).
The iOS build ran on an iPhone 18 Pro simulator with iOS 27.0. A temporary dev
harness invoked real native modules and recorded callbacks; the bridge was not
mocked. Synthetic locations and permission states were set using adb/simctl.
The harness and entry-point import were removed after testing.

| Check                                                   | Android emulator                                        | iOS simulator                                                                |
| ------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Core device/build flags and OS/SDK constants            | Expected non-Horizon values                             | Expected non-Horizon values                                                  |
| Position requests without location permission           | Explicit legacy and `/next` permission errors           | Explicit legacy and `/next` permission errors                                |
| Native `removeWatchAsync` without location permission   | Resolves for an absent watch ID; no authorization error | Resolves                                                                     |
| Invalid motion timeouts                                 | `ERR_LOCATION_INVALID_TIMEOUT`                          | `ERR_LOCATION_INVALID_TIMEOUT`                                               |
| Motion request with 250 ms timeout                      | `ERR_LOCATION_MOTION_ACTIVITY_TIMEOUT` after 280 ms     | Immediate `ERR_MOTION_ACTIVITY_UNAVAILABLE`, as expected on simulator        |
| Legacy current/last-known and `/next` position          | Valid fixes                                             | Valid fixes                                                                  |
| Forward/reverse geocoding, default and explicit locales | Valid results, localized reverse result                 | Valid results, localized reverse result                                      |
| Invalid geocoding coordinates                           | `ERR_INVALID_COORDINATES`                               | `ERR_INVALID_COORDINATES`                                                    |
| Legacy and `/next` watchers                             | Callbacks, no errors                                    | Callbacks, no errors                                                         |
| Disposal, then another injected location                | Callback counts unchanged                               | Callback counts unchanged                                                    |
| `/next` nullable payload fields                         | Keys present                                            | All eight inspected keys present; seven unavailable values explicitly null   |
| Local scheduled notification                            | Received callback and presented ID match                | Received callback, presented ID and visible banner match                     |
| Notification tap                                        | Not exercised                                           | Lock-screen tap reopened app; response callback and last-response ID matched |
| Notification cleanup                                    | Empty scheduled/presented queues                        | UI cleared the actual last response; native read returned null; queues empty |

Android's `/next` foreground session started as `PROMOTED` and stopped as
`NOT_RUNNING`. Its legacy location task service also recovered after backgrounding,
process death, and relaunch: the process ID changed, foreground promotion returned,
and task callbacks resumed without errors. Tracking was then stopped and its
registration cleared. This is emulator evidence for the retained November 17 fix,
not a claim about all OEM lifecycle conditions.

The iOS tap used the actual system notification UI. A background notification
with ID `3fd92a48-4ba8-4c8f-8ada-cbdcdf4671d0` produced
`expo.modules.notifications.actions.DEFAULT` and the same last-response ID.
The unsigned simulator build still logs a missing Keychain entitlement when
reading persisted server registration info; local notification operations passed.

## Pending Quest and other limits

Connect the headset to run the prepared Quest build and check: device/OS detection,
legacy watcher cleanup after permission changes, `/next` foreground-service
sessions and position watching, explicit geocoding/motion unavailability,
notification delivery/taps, and panel sizing. Quest compilation and core JVM tests
do not replace these checks.

Physical Android/iOS devices, the motion receiver concurrency regression under
real sensor callbacks, iOS motion hardware, the Apple Silicon Mac permission-denial
path, Android notification taps, cold-launch notification responses, real remote
push, geofencing, long-running tracking, and optimized Quest release/R8 behavior
remain unverified. The absent-watch cleanup check is narrower than a live watcher
surviving permission revocation, which can terminate the Android process. Imported
Swift tests were not run through XCTest.

Detailed logs, runtime JSON, package metadata and native build artifacts are saved
outside Git in the local release-evidence directory `2026-11-27-refresh`. No device
coordinates or push-token contents are included in this report.
