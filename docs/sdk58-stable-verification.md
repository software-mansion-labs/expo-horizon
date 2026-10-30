# Expo SDK 58 stable verification

Validated on 2026-10-19 in the existing `jtatar/sdk58-upgrade-poc` worktree.
The source baseline is `8b967b2d9fc8fedf5ed3717f24eaa88d50bea56e`, plus the
changes accompanying this report. Unrelated edits in the primary checkout were
not included.

## Upstream and dependencies

The pinned source is Expo tag `expo@58.0.14`, commit
[`63dabd3d010d8ba8bb63dd269928bed37e29b015`](https://github.com/expo/expo/commit/63dabd3d010d8ba8bb63dd269928bed37e29b015).
The fetched `sdk-58` branch lagged the published package tags, so the release tag
was used to include the latest released location and notifications patches.
The original upstream checkout was not switched or modified.

| Package                     | Selected version |
| --------------------------- | ---------------- |
| Expo                        | 58.0.14          |
| Upstream expo-location      | 58.0.17          |
| Upstream expo-notifications | 58.1.5           |
| React Native                | 0.88.0           |
| React / React DOM           | 19.3.0           |
| expo-application            | 58.1.2           |
| expo-constants              | 58.0.12          |
| expo-router                 | 58.0.23          |
| expo-task-manager           | 58.0.12          |
| jest-expo                   | 58.0.11          |
| expo-module-scripts         | 56.0.8           |
| Prettier / Oxlint           | 3.9.10 / 1.88.0  |

All three Horizon packages remain **58.0.0, unpublished**. No packages were
published and no remote release tags were created.

SDK-managed dependencies follow the selected Expo release's
`bundledNativeModules.json`. Newer incompatible or unvalidated major versions
reported by `yarn outdated` were not substituted: Babel 8, AsyncStorage 3,
TypeScript 7, and memfs 4. React 19.3.0 follows Expo's supported pairing rather
than the independently published 19.3.1 patch. The public build tool remains
`expo-module-scripts@56.0.8`; upstream's replacement
`@expo/internal-scripts@58.0.3` is private and cannot be used by this fork.

The example now uses the splash-screen config plugin and includes
`expo-system-ui` for its configured appearance. Its obsolete `newArchEnabled`
option was removed. These changes resolve Expo Doctor's SDK 58 configuration
checks.

## Synced behavior and parity

The sync includes the new Android `/next` background task and foreground-service
APIs, watcher lifecycle/status changes, notification permission helpers, legacy
location task service safeguards, iOS geofencing and watcher fixes, and the iOS
notification-handler main-queue fix. Imported changelog entries retain upstream
wording and attribution under `Unpublished`. This stable-release refresh changes
Core dependencies and documentation only. The SDK 58 branch already requires an
explicit `supportedDevices` list; that breaking change remains documented in the
Core README and the PR release notes.

Quest uses the Android location provider. Its `/next` foreground-service
sessions support position watchers while backgrounded. Google Play Services,
background location permissions/tasks, heading, and motion activity retain
explicit unavailable behavior. This does not add background task support to
Quest.

Read-only comparison against the pinned commit found:

- Both iOS trees match byte for byte.
- The flattened notifications Android mobile tree matches byte for byte.
- Location Android mobile differs only by the existing `isHorizon` constant and
  its `Utilities.kt` device-detection helper. These preserve the public Horizon
  detection API; Quest exceptions now reside in the Quest source set.
- TypeScript differences are the Horizon location flag, Horizon push-token
  detection/type, and formatting. The new `/next` API otherwise follows upstream.
- The existing upstream test-fixture allowance hashes remain unchanged. Their
  original source pin remains valid for those unchanged fixtures.

The parity helper returns **1** for the documented location extension; this is
not an assertion of completely identical Android sources. The read-only helper
from the primary checkout was used because this older branch's bundled helper
replaces source files during comparison.

## Automated and build checks

Use Node **24.9.0** from `.nvmrc`, Yarn Classic, Android SDK from the local Android
Studio installation, and Xcode **27.1 (27A9275)**.

| Check                                                                                   | Result                                                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `yarn install --frozen-lockfile --non-interactive`                                      | Pass                                                                                                   |
| `CI=1 yarn verify`                                                                      | Pass: package/plugin builds, lint, formatting, TypeScript, 18 Jest suites; 123 tests passed, 1 skipped |
| `yarn --cwd example expo install --check`                                               | Pass                                                                                                   |
| `expo-doctor@1.21.5 example`                                                            | Pass: 20/20 checks                                                                                     |
| Clean Expo prebuild                                                                     | Pass                                                                                                   |
| Repeat prebuild without `--clean`                                                       | Pass; Android Gradle properties, flavor configuration, and manifest files unchanged                    |
| `:app:assembleMobileDebug :app:assembleQuestDebug -PreactNativeArchitectures=arm64-v8a` | Pass                                                                                                   |
| iOS simulator Debug build, signing disabled                                             | Pass                                                                                                   |
| Android notifications native unit tests                                                 | Both flavors pass: 55 passed and 15 existing skips per flavor                                          |
| `npm pack --dry-run --ignore-scripts` for all three packages                            | Pass; required built entry points and plugins included                                                 |

Android builds used `./gradlew --no-daemon --console=plain`. iOS used `pod install`
and `xcodebuild -workspace expohorizondemo.xcworkspace -scheme expohorizondemo
-configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS
Simulator' CODE_SIGNING_ALLOWED=NO build` with a dedicated derived-data directory.

The notifications native suites required an external Gradle init script because
this standalone repository does not include Expo's `expo-modules-test-core`
project. It supplied the matching JUnit, AndroidX Test, MockK, Robolectric, Truth,
and coroutine-test dependencies and enabled Android resources. Robolectric 4.16
ran with an API 35 default under Java 17; its explicit per-test SDK overrides
were retained. This is JVM test evidence, not testing on every Android API level.
The actual app target SDK was not lowered.

Merged manifests retain background location and motion permissions on mobile
and omit them on Quest. Both include foreground location/service, notification,
and boot permissions and the new location service.

## Runtime checks

Runtime checks called the actual native bridges through a temporary development
instrumentation import and the React Native debugger. The import and temporary
example helper were removed after testing. Coordinates and push-token contents
were not recorded in this report.

| Check                               | Android mobile emulator, API 37                   | iPhone 18 Pro Max simulator, iOS 27.0                   | Physical Quest 3, Horizon OS / Android 14, API 34                                                       |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Core build/device flags             | Mobile flags                                      | Non-Horizon flags                                       | Both Horizon flags true; configured demo app ID                                                         |
| Denied foreground permission        | Expected native rejection                         | Expected native rejection                               | Expected native rejection                                                                               |
| Granted foreground permission       | Pass                                              | Pass                                                    | Pass                                                                                                    |
| Legacy and `/next` current location | Both return positions                             | Both return positions                                   | Both return real provider positions                                                                     |
| Watcher callbacks                   | Pass                                              | Pass                                                    | Pass                                                                                                    |
| Watch pause/resume/dispose          | Pass                                              | Pass                                                    | Pass; both legacy and `/next` callbacks stop                                                            |
| Foreground location service         | Promoted; callbacks continue in background; stops | Android-only API                                        | Promoted and stopped; background state unverified                                                       |
| `/next` background task             | Registered, received position callback, stopped   | Inactive handle stop is safe; active task not exercised | Rejects with `ERR_QUEST_FEATURE_UNAVAILABLE`                                                            |
| Local notification delivery         | Callback and presented notification               | Callback and presented notification                     | Callback and presented notification                                                                     |
| Quest unsupported APIs              | Not applicable                                    | Not applicable                                          | GMS, heading, motion, background permission and task handle reject explicitly; motion permission denied |

Android and Quest delivered local notifications through the inexact-alarm fallback
with exact-alarm permission denied; delivery was later than the requested two
seconds. iOS delivered while foregrounded. Tapping its notification from the lock screen
reopened the app, produced the response listener event and saved response, and
clearing the saved response returned `null`. The user then closed the Quest app
window and tapped the delivered smoke-test notification. The app reopened, and
`NotificationsEmitter.onNotificationResponseReceived` logged the matching request
identifier and default action. Android reported a new resumed activity in the
same still-running process. This confirms the closed-window reopen path, not a
cold start after process termination. The Quest JavaScript response getter and
clear operation were not read back because the debugger did not reconnect after
Metro restarted. Android mobile tapping remains unverified.

The Quest app remained `active` after launching Home because of
Horizon OS multiwindow behavior, so this run does not establish background
callback delivery on Quest.

## Remaining limits

- Real remote push delivery is unverified: the demo uses `DEMO_APP_ID`, and valid
  Meta/FCM/APNs credentials were not configured. The unsigned iOS simulator also
  logs a keychain entitlement error from persisted remote-registration state.
- Physical iPhone behavior, geofence transitions, device reboot recovery,
  long-duration tracking, and release/store builds were not exercised.
- iOS native XCTest suites were not executed; the iOS evidence is compilation,
  the existing Jest suites, and simulator runtime checks.
- Android mobile notification tapping, Quest process-cold notification launch,
  and delivery across every background/reopen state remain unverified. Quest
  foreground-service startup, watcher callbacks,
  pause/resume/disposal, and service shutdown passed; the minimized-app callback
  case was not observed.

Builds, mocked JavaScript tests, JVM native tests, and device observations are
reported separately. This report is not evidence of package publication.
