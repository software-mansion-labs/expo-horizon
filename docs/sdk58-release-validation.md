# SDK 58 release validation

## Source and scope

Validation on 2026-11-02 started from `origin/main` at
`a1b4fbdfb8116487d9acd734c48c03c264db21b8`. The release candidate is
**58.0.0** for all three packages. npm's complete published baseline was **57.0.3**;
no stable SDK 58 version was published when checked.

## Release status

The prepared source tested by GitHub Actions is
`58cf6bec99766af2e13aac21c6490f541e12252d` on
`jtatar/sdk58-release-validation`. On 2026-11-02:

| Check                                                                                                         | Result                                                                                         |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Release preparation dry run](https://github.com/software-mansion-labs/expo-horizon/actions/runs/41422493385) | Passed; no additional metadata changes                                                         |
| [Publication dry run](https://github.com/software-mansion-labs/expo-horizon/actions/runs/41422498863)         | All three packages passed; tarballs byte-identical to two local runs                           |
| [Native Compatibility](https://github.com/software-mansion-labs/expo-horizon/actions/runs/41422506234)        | Android mobile, Quest debug, optimized Quest release, and unsigned iOS simulator builds passed |
| [Authorized live publication](https://github.com/software-mansion-labs/expo-horizon/actions/runs/41425247356) | Verification passed; first upload failed with npm `ENEEDAUTH`                                  |

Both release dry runs and the live workflow passed 20 Jest suites: 189 tests
passed, one existing skip. All 18 release regression tests passed. The live run's
artifacts also match the dry-run tarballs byte for byte.

Registry checks after the failed upload confirmed **no 58.0.0 package was
published**; all three `latest` tags remain **57.0.3**, and there is no
`v58.0.0` release tag. The previous releases used npm trusted publishing through
`publish.yml`. Authorization for `release-stable.yml` still needs confirmation
for all three packages; see [publishing setup](../CONTRIBUTING.md#one-time-setup).
No PR was merged as part of this release preparation.

These results refer to the exact source SHA above. Later documentation corrections
do not establish a new native/device test result. Rehearse any updated release
source before publishing it; retain the original SHA if retrying its artifacts.

## Validation scope

Work used the isolated `jtatar/sdk58-release-validation` checkout. Unrelated
notification and example edits in the original checkout were **excluded**.
The native libraries tested are from that main commit. The example fixes below
were then tested through Metro. No package implementation was changed.

This is a scoped smoke test, not confirmation of every API or hardware scenario.
The open checks below remain release-signoff items. A package dry run cannot
close them.

## Release notes handoff

Core has no package changelog; include these notes in the release announcement:

- **Breaking:** the core config plugin now requires a non-empty
  `supportedDevices` string, such as `quest2|quest3|quest3s`. Apps that omitted
  it must add it before prebuilding.
- Added `horizonOsVersion` (an opaque display label), `horizonSdkVersion`,
  and `isHorizonSdkVersionAtLeast(version)`. Availability is independent of
  Android build flavor. Version constants are `null` off Horizon OS; comparison
  returns `false` on non-Horizon Android and throws
  `ERR_HORIZON_SDK_UNAVAILABLE` on iOS/web.
- Horizon device detection uses the OS detector, retaining the older Quest
  model fallback.
- Added optional `horizonMinSdkVersion` and `horizonTargetSdkVersion`
  declarations to the Quest manifest. These use Meta's SDK numbers, independently
  of Android API levels, and must be integers from 61 through 2147483647.
- Added optional positive-dp `minWidth` and `minHeight` panel constraints.
  These and the Meta SDK declarations apply only to Quest.

The [location changelog](../expo-horizon-location/CHANGELOG.md) and
[notifications changelog](../expo-horizon-notifications/CHANGELOG.md) contain the
package notes, including repaired omissions from the original SDK 58 sync.
The audit compared the changes since `v57.0.3` with the published upstream
`expo-location@58.0.20` and `expo-notifications@58.1.7` changelogs.
Imported entries retain their original wording, links, attribution, and category;
published Horizon history is unchanged.

Call out these migration points in the announcement:

- Location's legacy iOS foreground permission response now exposes `scope`
  and `accuracy` under `ios`.
- The new location `/next` API supports foreground permissions, fixes, watchers,
  and foreground-service sessions on Quest. `LocationUpdatesHandle` background
  tasks explicitly reject on Quest; legacy foreground-service tracking is separate.
- Foreground notifications display by default unless a handler changes that
  behavior; a handler timeout no longer silently discards them.
- Notifications add grouping, Android alarm-clock delivery and exact-alarm
  permission helpers, a large-icon plugin option, and the option to disable
  remote-notification setup for local-only apps.
- Notification fixes include retrying transient native push-token failures,
  Android notification actions after app updates, and Quest R8 compatibility.
  The complete platform-specific upstream fixes remain in the package changelogs.

Example-only fixes in this preparation:

- Stop position, heading, and motion subscriptions when leaving Location;
  replace a previous watch on repeated starts and discard subscriptions whose
  asynchronous startup finishes after the screen loses focus.
- Keep the top controls below the iOS navigation bar on all three demo screens.
- Define the demo's location/geofence tasks at app startup, so a background
  launch does not depend on first mounting the Location screen. The custom
  entry also imports the existing notification task before registering Router.

These example fixes belong in this handoff rather than a package changelog.
Mechanical version changes, CI, and sync tooling do not add package behavior notes.

## Test environments

| Target                 | Build                     | Environment                                                       |
| ---------------------- | ------------------------- | ----------------------------------------------------------------- |
| Android mobile         | `mobileDebug`             | Pixel 9 Pro emulator, Android 17 / API 37, ARM64                  |
| Quest                  | `questDebug`              | Physical Quest 3, Android 14 / API 34, Horizon OS 2.7.0 / SDK 207 |
| Mobile flavor on Quest | `mobileDebug`             | Same Quest; core detection/version checks only                    |
| iOS                    | Debug, unsigned simulator | iPhone 18 Pro, iOS 27.0; Xcode 27.2                               |

Location points were injected on the phone simulators. Quest returned real network
provider fixes. No location coordinates or push-token contents are included here.
Runtime probes called the actual native modules through Hermes; they were not
mocked JS tests. Temporary `/next` probe imports were removed from the example.

## Results

On 2026-11-02, the user confirmed on the physical Quest that the panel resizes
larger and down to the smallest size the headset permits, with controls remaining
usable. This manual resizing/usability check passed; exact dp dimensions were not
measured on the headset.

| Check                                    | Android mobile                                                 | Quest                                                                   | iOS simulator                                                     |
| ---------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Launch and navigation                    | Pass                                                           | Pass; headset UI automation limited                                     | Pass                                                              |
| Core device/build flags                  | false / false                                                  | true / true; mobile flavor true / false                                 | false / false                                                     |
| OS label / SDK constant                  | null / null                                                    | 2.7.0 / 207 in both flavors                                             | null / null                                                       |
| SDK comparisons                          | Expected false/invalid-input errors                            | 1/60 false; 61/207 true; 208 false; invalid-input errors                | Expected unavailable error                                        |
| Location permission denied, then granted | Explicit `ERR_LOCATION_UNAUTHORIZED`; grant restored           | Same error; grant restored                                              | Native denial dialog, explicit permission error; grant restored   |
| Current and cached position              | Pass, injected fixes                                           | Pass, network fixes; initially empty cache                              | Pass after injected fix; `mocked: true`                           |
| Legacy and `/next` watch callbacks       | Pass                                                           | Pass                                                                    | Pass                                                              |
| Watch stop and callback cleanup          | Pass; counts unchanged after more injected fixes               | Pass; counts unchanged after stop                                       | Pass; counts unchanged after more injected fixes                  |
| Demo watch navigation cleanup            | Pass; repeated start retains one subscription, stop removes it | Not separately exercised                                                | Pass after navigation transition                                  |
| Geocode / reverse geocode                | Pass                                                           | Expected `ERR_QUEST_FEATURE_UNAVAILABLE`                                | Pass                                                              |
| Heading / motion                         | No readings within 20-second probe window; hardware check open | Explicit unavailable errors; motion permission denied                   | Hardware check open                                               |
| Legacy location foreground service       | Starts, delivers while backgrounded, stops                     | Starts, delivers in foreground, stops; background transition unverified | Not configured                                                    |
| `/next` foreground-service session       | Starts/promotes and stops                                      | Starts/promotes and stops                                               | Android-only API                                                  |
| `/next` location background task         | Registers, callback observed, stops                            | Expected `ERR_QUEST_FEATURE_UNAVAILABLE`                                | Expected missing background-mode error                            |
| Geofence                                 | Registers, initial event observed, stops                       | Unsupported                                                             | Simulator reports `ERR_GEOFENCING_UNAVAILABLE`                    |
| Notification permissions                 | Granted/read back                                              | Granted/read back                                                       | Native prompt granted/read back                                   |
| Foreground local notification            | Received callback and presented notification                   | Received callback and presented notification                            | Received callback and presented notification                      |
| Notification schedule/list/cancel        | Pass                                                           | Pass                                                                    | Pass                                                              |
| Notification opening/last response       | Foreground and background cases pass; clear succeeds           | Clear succeeds; headset tap unverified                                  | Background notification opening and response pass; clear succeeds |
| Categories                               | Create/read/delete pass                                        | Create/read/delete pass                                                 | Create/read/delete pass                                           |
| Channels/groups                          | Create/read/delete pass                                        | Create/read/delete pass                                                 | Not applicable                                                    |
| Badge                                    | Not checked                                                    | Not checked                                                             | Set/read/restore pass                                             |
| Notification task registration           | Register/unregister pass; counter execution unverified         | Register/unregister pass; execution unverified                          | Explicit missing remote-notification background-mode error        |
| Remote push                              | Unverified by agreement                                        | Unverified by agreement                                                 | Unverified by agreement                                           |

Foreground notification request identifiers:
Android `0ead837d-2f7a-4b0e-8367-51039fbf84cf`,
Quest `e0e5d0f7-8d4a-4833-b730-7c9cf4e003e9`,
iOS `d3de0916-aa16-4e52-bdf3-f3eafd4e6e71`.
Background opening responses matched the scheduled identifiers on Android
(`1e0b9d80-def2-4736-b2ec-09ba830eaade`) and iOS
(`08914b99-d789-4bca-8af0-34ecebb30281`).

Probe limitations: the first `/next` calls used the wrong JS namespace and were
rerun through its `Location` export. A cleanup probe used `remove` instead of
`dispose` and was corrected. These harness errors are not package failures.
Debugger evaluations while iOS was suspended in Notification Center did not
answer until the app resumed.

## Build and automated evidence

- Node **24.9.0** from `.nvmrc`; frozen Yarn install succeeded.
- `yarn verify` on main passed: package/plugin builds, lint, formatting,
  package/example types, and 20 Jest suites (189 passed, one existing skip).
- Clean prebuild and CocoaPods installation succeeded.
- Android mobile/Quest debug builds succeeded. Core native tests passed:
  18 in each flavor. The Quest release built successfully with R8 enabled.
- The unsigned iOS simulator build succeeded.
- Merged manifests retained mobile background-location/motion permissions and
  omitted them from Quest. Quest alone had Meta target SDK 207 and panel
  dimensions 1024×640 dp, minimum 600×400 dp.
- Repeating prebuild produced identical `app/build.gradle`, `gradle.properties`,
  and main/Quest manifests. This CLI regenerated native directories during the
  repeat; the comparison establishes deterministic output, not preservation of
  hand-edited native projects.
- All 18 release regression tests passed.
- Final frozen install and `yarn verify` passed with the same 189 passed tests
  and one existing skip. Fresh JS launches on all three platforms had all demo
  tasks defined before visiting Location; the native task registry was empty
  after test cleanup.
- Preparation followed by the workflow's Prettier step was idempotent across
  package manifests, native versions, compatibility tables, and changelogs.
  Preparation alone rewrites table padding; formatting restores the same bytes.
- Online `expo install --check` reported newer recommended patches:
  expo 58.0.22, expo-build-properties 58.0.12, expo-router 58.0.29,
  expo-task-manager 58.0.13, and react-native-screens 4.30.1.
  The locked main versions were retained. Offline checking passed against the
  installed SDK metadata, with Expo's warning that offline validation is unreliable.

Local logs and sanitized runtime results are saved outside the checkout in
`expo-horizon-release-evidence/2026-11-02/`. The packaging rehearsal records
its exact committed source SHA in the log and each tarball's `gitHead`.

## Remaining release-signoff checks

- Remote push token acquisition, delivery, and response need configured Meta,
  FCM, and APNs credentials. The user explicitly chose to leave these unverified.
  The unsigned iOS build also logs a Keychain entitlement error for persisted
  remote registration; local notifications still work.
- Verify Quest notification taps and location delivery while its panel is
  actually backgrounded. The tested headset kept reporting the app active
  during automated Home/settings transitions.
- Check phone heading/motion and iOS geofence transitions on physical hardware.
  Android geofence entry was observed, but exit/reboot/app-update delivery was
  not exercised.
- Enable the iOS demo's background modes before validating background location
  and background remote-notification tasks. The current example intentionally
  remains the configuration from main.
- Verify the notification task counter and exact-alarm permission grant/timing.
  Scheduling/cancelling an alarm-clock request with exact permission denied is
  not proof of exact delivery.

A local preparation/publish dry run checks metadata and tarball contents only.
It does not publish npm packages, create a remote release tag, exercise GitHub
Actions permissions or bot PR creation, or prove npm upload authorization.
