# Expo SDK 58 patch refresh verification

Validated on 2026-10-30 from PR #79 source commit
`81225f24d04389c532ac449c39e46b372962fe1e`, plus the patch refresh accompanying
this report, on `jtatar/sdk58-upgrade-poc`. Work used the clean existing isolated
worktree. Unrelated notification and example edits in the primary checkout were
not included or modified.

## Selected upstream release

The source is Expo tag `expo@58.0.21`, commit
[`075c93fe58bb4f76316183ac7fdb005403475970`](https://github.com/expo/expo/commit/075c93fe58bb4f76316183ac7fdb005403475970).
The npm registry and release tags were checked on the validation date. This
release contains the latest published stable SDK 58 location and notifications
sources. The original Expo checkout was not switched or edited; a temporary
sparse detached worktree was used and removed afterwards.

| Package                          | Previous | Selected |
| -------------------------------- | -------- | -------- |
| Expo                             | 58.0.14  | 58.0.21  |
| Upstream expo-location           | 58.0.17  | 58.0.20  |
| Upstream expo-notifications      | 58.1.5   | 58.1.7   |
| React Native and its Jest preset | 0.88.0   | 0.88.1   |
| expo-constants                   | 58.0.12  | 58.0.14  |
| expo-linking                     | 58.0.13  | 58.0.15  |
| expo-router                      | 58.0.23  | 58.0.28  |
| expo-splash-screen               | 58.0.10  | 58.0.12  |
| expo-status-bar                  | 58.0.3   | 58.0.4   |
| expo-system-ui                   | 58.0.6   | 58.0.7   |
| jest-expo                        | 58.0.11  | 58.0.13  |
| @expo/image-utils                | 0.12.5   | 0.12.6   |

Other SDK-managed dependencies follow the selected release's
`bundledNativeModules.json`. React/React DOM remain 19.3.0, expo-application
58.1.2, and expo-task-manager 58.0.12. The public build tool remains
expo-module-scripts 56.0.8, the highest published stable version in its SDK line.
The version-resolution helper cannot read the removed upstream
`packages/expo-module-scripts/package.json`; versions were read directly from
the pinned manifests and confirmed against npm instead. Upstream's replacement
`@expo/internal-scripts@58.0.5` is private and is not substituted into the fork.

All three Horizon packages remain **58.0.0, unpublished**, confirmed against npm.
This is an SDK patch sync, not release preparation. No packages or remote release
tags were published.

## Source changes and parity

The full location and notifications delta was reviewed, including package
metadata, native sources, TypeScript, plugins, tests, and changelogs.

- The legacy Android location service now promotes itself in `onStartCommand`
  using options carried in the intent. This fixes the upstream lost-updates/ANR
  issue after app updates. The consumer retries service startup on host resume.
- Quest's legacy consumer passes the same options and uses the shared rejection
  check. Its `/next` module passes the new JS logger to the Android provider.
  Existing Quest support and unavailable-feature decisions remain unchanged.
- Location diagnostics use the JS logger where upstream does; foreground-service
  promotion failures also produce a native log.
- Notifications uses optional native-module loading for topic subscriptions, with
  the upstream five-case regression suite for missing modules and Expo Go errors.
- Both iOS source trees are unchanged and match the pinned upstream byte for byte.
  Notifications Android mobile is also byte-for-byte equivalent. Location Android
  mobile retains only the existing `isHorizon` constant and `Utilities.kt` helper.
- Remaining TypeScript differences are the Horizon location flag, Horizon push-token
  type/detection, and formatting. No plugin, manifest, ProGuard, podspec, or native
  dependency changes were omitted; the upstream Gradle changes only update upstream
  version numbers, while Horizon retains its own 58.0.0 version fields.

The read-only parity helper returns **1** for the documented location extension.
Every reported difference was reviewed; this is not a claim of completely identical
Android sources. The helper from the primary checkout was used with its root pointed
at the PR worktree because this older branch's helper mutates source files. Existing
verification-fixture allowance hashes remain unchanged.

Upstream entries were imported verbatim under `Unpublished`, grouped by upstream
version. Their precompiled-binary notes describe Expo's releases; Horizon builds
its native forks from source. The Android fixes apply to the corresponding shared
and Quest code, so no duplicate Horizon note was added. Dependency-only core and
example changes need no additional user-facing changelog entry.

## Automated and native checks

Tools: Node **24.9.0**, Yarn **1.22.22**, Java **17.0.21**, Xcode
**27.2 (27B52)**, and expo-doctor **1.21.5**.

| Check                                                                                     | Result                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deliberate lockfile regeneration, then `yarn install --frozen-lockfile --non-interactive` | Pass                                                                                                                                                                                   |
| `CI=1 yarn verify`                                                                        | Pass: package/plugin builds, Oxlint, Prettier, TypeScript, 19 Jest suites, 128 tests passed, one existing skip, one snapshot                                                           |
| `yarn --cwd example expo install --check`                                                 | Pass                                                                                                                                                                                   |
| `npx --yes expo-doctor@1.21.5 example`                                                    | Pass: 20/20                                                                                                                                                                            |
| `yarn --cwd example expo prebuild --clean --no-install`                                   | Pass; previous generated native files backed up first                                                                                                                                  |
| Repeat prebuild without `--clean`                                                         | Pass; Android Gradle properties, flavor configuration, and both manifests unchanged                                                                                                    |
| `:app:assembleMobileDebug :app:assembleQuestDebug -PreactNativeArchitectures=arm64-v8a`   | Pass                                                                                                                                                                                   |
| `pod install` and unsigned iOS simulator Debug build                                      | Pass                                                                                                                                                                                   |
| Merged manifest assertions                                                                | Pass: mobile retains background location/motion permissions; Quest excludes them; both retain location, foreground service, notifications, boot permission, and both location services |

Android used `./gradlew --no-daemon --console=plain`. iOS used:

```sh
xcodebuild -workspace expohorizondemo.xcworkspace \
  -scheme expohorizondemo -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/horizon-pr79-refresh-20261030/DerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

## Runtime smoke checks

Checks call the actual native modules through temporary development instrumentation,
with Metro attached. The temporary import and helper were removed after testing.
Location fixes were injected into the emulators; no coordinates or push tokens are
included in this report. These are native simulator checks, not JS mocks.

| Check                                  | Android mobile, API 37                                                                    | iPhone 18 Pro Max simulator, iOS 27.0                 |
| -------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Core device/build flags                | Both non-Horizon                                                                          | Both non-Horizon                                      |
| Location access without permission     | `ERR_LOCATION_UNAUTHORIZED` and `/next` `ERR_FOREGROUND_LOCATION_PERMISSIONS_NOT_GRANTED` | Not rerun; existing foreground grant retained         |
| Legacy and `/next` position reads      | Both return positions                                                                     | Both return positions                                 |
| Watcher callbacks and removal/disposal | Callbacks observed; no further callbacks after cleanup while more fixes were injected     | Same                                                  |
| `/next` foreground service             | `PROMOTED`/unthrottled after start; `NOT_RUNNING` after stop                              | Android-only check                                    |
| Local notifications                    | Receipt callback, successful handler, and presented notification confirmed                | Receipt callback and presented notification confirmed |

Android initially reported `ERR_LOCATION_SETTINGS_UNSATISFIED` while Google Location
Accuracy was disabled. After accepting the emulator's settings prompt, the final
location checks passed. This required no library change.

The Android legacy task remained registered after `adb install -r` of the same APK
and delivered callbacks in the new process. The initial service snapshot after
reinstall showed no service; a subsequent Home/resume cycle promoted it successfully
(`isForeground=true`). No explicit task restart was issued. This confirms the resume
retry, but **does not establish immediate foreground-service recovery on the first
cold launch after an update**. That timing remains a follow-up before relying on
uninterrupted background tracking. This was a package-replacement rehearsal, not a
store update or an old-APK-to-new-APK migration.

Stopping the restored task and five rapid start/stop cycles left no registered task
or foreground notification (`startRequested=false`). However, `dumpsys` still showed
a bound legacy service and retained connections. Upstream `stopForegroundService()`
only calls `stop()`; it does not unbind. That same cleanup code existed before this
refresh. This is an observed upstream lifecycle limitation, not a clean service
destruction pass. The `/next` service stopped normally. The demo process was stopped
afterward to release the test bindings. Local notifications used fresh identifiers and waited for handler completion
before checking presentation; an earlier short observation window was inconclusive.

## Remaining limits

No physical Quest was connected, so this refresh has Quest compilation and manifest
coverage, not a new Quest device pass. Physical iPhone behavior, real Meta/FCM/APNs
push delivery, reboot/long-duration/geofencing scenarios, notification tap/cold-start
flows, release/store builds, native XCTest, and Android JVM suites were not rerun.
The unsigned iOS simulator reports a missing Keychain entitlement when reading
persisted push-registration information; local notifications still work. Valid
credentials and a signed build are needed to validate push registration and delivery.
The example continues to use `DEMO_APP_ID` and its existing development deep-link
scheme fallback warnings remain.

The [October 19 report](sdk58-stable-verification.md) records earlier device/JVM
coverage against the previous source. Those results are historical, not evidence
that those scenarios were rerun against this patch refresh. Build and test passes
do not establish publication or store approval.
