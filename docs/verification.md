# Verification

From the repository root, use the Node version in `.nvmrc` and install with
`yarn install --frozen-lockfile`, then run:

```sh
yarn verify
```

This builds all packages and config plugins, runs the existing ESLint and Prettier
checks, type-checks all packages and the example, and runs Jest once. It needs no
Android SDK, Xcode, device, or service credentials. Generated build output, Expo
caches, and the example's generated native projects are excluded from formatting.

CI runs the same commands as separate named steps. After dependencies install,
ESLint and formatting still run if a build fails. Type checks and Jest require
successful library and plugin builds, but run even if another quality check fails.
Any failed check fails the job; cancelling the workflow stops the remaining checks.
The local `yarn verify` command still stops at the first failure.

For a focused rerun:

```sh
yarn test --selectProjects plugins
yarn test --selectProjects expo-horizon-location/android
yarn test --selectProjects expo-horizon-notifications/ios
yarn build:plugins
yarn ts:check
```

The root Jest configuration runs the existing location tests on Android and iOS,
notifications tests on iOS (including the existing export snapshot), core SDK version
fallback tests on web, and config plugin tests in Node. The Horizon native bridge
is mocked as a mobile device for these JS tests; they do not establish Quest native
behavior. The existing Android
Google Maps geocoding test remains skipped because it requires an API key.

The restored Xcode fixture and its test-path adjustment are recorded as exact,
reviewed differences in `upstream-allowances/verification-tests.json`. Review those
hashes and their pinned Expo commit when changing the fixture or upgrading the SDK.

Core plugin tests run Expo's mod compiler against temporary native files. They
check mobile/Quest permission separation, Quest options, and repeatable output,
including updating `horizonAppId`. Temporary files are removed after each test.
SDK version tests also check the namespaced Quest declaration, optional values,
invalid configuration, and removal of settings on a subsequent prebuild.
Panel sizing tests cover optional `minWidth` and `minHeight`, positive dp
validation, minimums without default dimensions, repeatable output, and updating
or removing minimums while leaving the mobile manifest unchanged.
This validates generated overlays; native builds must still validate manifest
merging and Gradle compatibility.

## Device smoke test

Run this after SDK/native changes and before release. Use the example development
build on an Android device, a physical Quest, and an iPhone or iOS simulator.
Record the commit, build variant, device/OS, permission state, and result for each
check. Run from `example/`:

```sh
yarn android  # Android mobileDebug
yarn quest    # Quest questDebug
yarn ios      # iOS
```

Keep Metro attached so callback activity and native errors are visible.

| Area                | Procedure and expected evidence                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core                | Open Horizon. Confirm the device/build flags match the target and the configured app ID is visible.                                                                                                                                                           |
| Permissions         | On Location, deny then grant foreground permission. On Notifications, request permission and read it back. Record results; denied permissions should surface a clear error when used.                                                                         |
| Location            | Read current and last-known position. Record a fix, `null` cache result, or explicit provider error. On Quest use a network location provider when GPS is unavailable; do not count lack of a fix as successful positioning.                                  |
| Watch cleanup       | Start Location Watching, observe callbacks, then Stop Location Watching. Move the device or inject another emulator location and confirm callbacks stop. Start and stop again; navigating away from Location must also stop callbacks.                        |
| Quest limitations   | Exercise heading and motion activity. The Quest build should report explicit unavailability, with denied motion permissions. Test background permission and foreground-service tracking separately; one does not prove the other works.                       |
| Local notifications | Send Notification, observe delivery after two seconds, tap it, read Last Notification Response, then clear it. Repeat with the app backgrounded and after reopening. Record the request identifier and callback/response behavior.                            |
| Push                | With valid platform credentials, Get Push Token should return a token with the expected platform type (`horizon`, `android`, or `ios`). Then send a real remote notification and verify receipt and response. Without credentials, record this as unverified. |

Use a clean prebuild when validating an SDK upgrade. Back up any intentional native
edits before `yarn expo prebuild --clean --no-install` in `example/`. Build both
Android variants and inspect their merged manifests: Quest restrictions must not
remove mobile permissions. Repeating prebuild without `--clean` should not duplicate
flavors or app ID entries.

Save a short result table with pass/fail/unverified and error codes or log excerpts.
Avoid saving exact coordinates or push-token contents in committed evidence. A JS
unit-test pass, a successful build, and a device smoke pass are separate evidence.

## Panel size checks

After Android prebuild, build both Android variants and inspect their merged
manifests. The example's Quest `MainActivity` layout should contain
`defaultWidth="1024dp"`, `defaultHeight="640dp"`, `minWidth="600dp"`, and
`minHeight="400dp"`, all in the Android namespace. The mobile variant should
have no panel layout added by the plugin.

Install the Quest build and resize its panel using the headset's window controls.
Verify that it starts at the configured default size, can grow, and stops
shrinking at the configured minimums. Check the UI at the smallest permitted
size. A successful manifest check or app launch alone does not verify the
headset's resizing behavior.

### Panel minimum configuration verification — 2026-10-14

Verified commit `1b1a43b6`. `yarn verify` passed (166 tests, one existing skip),
and both optimized Android release variants built successfully. The merged Quest
manifest contained the four dimensions above; the mobile manifest contained no
panel layout.

Installed and opened `questRelease` on the Quest 3 running Horizon OS `2.7.0`
/ SDK 207. Android reported an initial window of `1024 × 640dp`, and the Horizon
screen displayed the expected device/build flags and OS version without a fatal
app error. Shrinking and growing the panel with headset controls remains unverified.

## Horizon OS SDK version checks

After Android prebuild, run the native compatibility tests from `example/android`:

```sh
./gradlew :expo-horizon-core:testMobileDebugUnitTest :expo-horizon-core:testQuestDebugUnitTest
```

These exercise the real Meta utility library without Horizon OS classes, verifying
the fallback on non-Horizon systems and rejection of invalid version numbers.
OS display-version tests cover unavailable APIs, legacy names, and preserving the
opaque label. Robolectric tests exercise Meta's real OS detector with modern and
legacy system features, Quest model fallback, and ordinary Android devices.
They run in the native Android CI jobs too. They do not prove detection on a Quest.
Native CI also builds an optimized Quest release to validate the consumer R8
rules for classes supplied by Horizon OS.

On the example's Horizon screen, use the **Horizon OS SDK** section:

The **Current SDK version** row reads `ExpoHorizon.horizonSdkVersion` directly.
It should show the device's numeric Horizon SDK version (207 on the tested Quest),
or `Unavailable` on non-Horizon Android, iOS, and web. Check this before using the
comparison button so the constant is verified independently of the helper.

The **Horizon OS version** row displays the user-facing OS label, separately from
the numeric SDK version. Expect a non-empty label where the OS display API is
available, or `Unavailable` elsewhere. Confirm the label is unchanged between
Quest and mobile builds on the same device and that **Is Horizon Device** remains
`true` in both.

| Input      | Expected result                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------- |
| 61         | `true` on a Quest with SDK 61 or newer; `false` on non-Horizon Android, iOS, and web.           |
| 207        | Matches whether the Quest's Meta VR OS SDK is 207 or newer, independent of Android's API level. |
| 2147483647 | `false` on current devices, without a crash.                                                    |
| 60 or 61.5 | A validation error displayed in the result field, without a crash.                              |

Repeat with the mobile build on Quest: SDK availability must not depend on the
build flavor. Record the device, OS/SDK version, build variant, and results. The
example declares target SDK 207 but leaves the minimum unset so older Quest
releases can still exercise the runtime fallback. Inspect merged manifests to
confirm the Meta target appears only in the Quest build.

### Physical Quest verification — 2026-10-14

Verified commit `3bef2645` on a Quest 3 running Horizon OS SDK 207
(`ro.vros.build.version`), Android 14 / API 34, OS build `52433670048800520`.
Installed the optimized `questRelease` and `mobileRelease` example APKs in turn
and exercised the Horizon screen through Android UI Automator and ADB input.
Both builds used their bundled JavaScript without Metro, covering the JS-to-native
bridge and the Meta utility in release builds.

| Check                           | `questRelease` | `mobileRelease` |
| ------------------------------- | -------------- | --------------- |
| `isHorizonDevice`               | `true`         | `true`          |
| `isHorizonBuild`                | `true`         | `false`         |
| SDK 61 or newer                 | `true`         | `true`          |
| SDK 207 or newer                | `true`         | `true`          |
| SDK 208 or newer                | `false`        | `false`         |
| SDK 2147483647 or newer         | `false`        | `false`         |
| Input 60                        | Error shown    | Error shown     |
| Input 61.5                      | Error shown    | Error shown     |
| SDK 207 after validation errors | `true`         | `true`          |

All checks passed. Invalid input displayed the native validation message,
`Horizon SDK version must be an integer between 61 and 2147483647.` The app
remained responsive, and process-filtered AndroidRuntime/ReactNativeJS logs showed
no crash during either run. The Quest release was restored after testing.

These results verify the SDK query on this OS version and its independence from
the build flavor. Older Horizon OS fallback paths and minimum-SDK installation
restrictions still require devices with the corresponding OS versions. This run
did not exercise location or notifications.

### Direct version field verification — 2026-10-14

Verified commit `c80a339c` on the same Quest 3 / Horizon OS SDK 207. In both
optimized release variants, **Current SDK version** displayed `207` immediately,
before using the comparison helper. The mobile build still reported
`isHorizonBuild: false`, confirming that the field is independent of build flavor.
The helper still returned `true` for 207 and `false` for 208 in both builds,
and the version field remained `207` afterward. The Quest release was restored.

`yarn verify` passed (139 tests, one existing skip), all seven native core tests
passed in each Android variant, both optimized Android releases built, and the
iOS simulator build succeeded. Native tests cover absent OS classes and fallback
between version APIs; web tests verify that the field is `null`. Physical older
Horizon OS releases remain unverified.

### OS display version and detector verification — 2026-10-14

Verified commit `40cb53f7` on the same Quest 3. The device reports the
`horizonos.software.horizon_os` system feature. Both optimized release variants
displayed `isHorizonDevice: true`, OS version `2.7.0`, and SDK version `207`.
`isHorizonBuild` was `true` for Quest and `false` for mobile. The SDK 207 helper
still returned `true`, and neither run produced a fatal app error.

`yarn verify` passed (140 tests, one existing skip), all 17 native tests passed in
each Android variant, both optimized Android releases built, and the iOS simulator
build succeeded. The native detector tests run Meta's actual utility against
simulated system features, including a device without Quest model branding and
older Quest model fallback. Older physical headsets remain unverified.

### Verification after rebasing onto main — 2026-10-14

Verified commit `86d00133`, based on `main` commit `9629beea`, with Expo `57.0.26`
and React Native `0.86.3`. Earlier dated records retain the original commit hashes
from the SDK 58 branch; these checks were rerun after rebasing the Horizon changes
without the SDK 58 upgrade.

- Frozen-lockfile installation and `yarn verify` passed: 14 suites, 128 tests,
  and one existing skip.
- All 17 native core tests passed in each Android variant.
- Both Android release variants built with
  `-Pandroid.enableMinifyInReleaseBuilds=true`; the iOS simulator build passed.
  SDK 57 requires the explicit Gradle property to enable R8, which is also set in CI.
- Merged manifests contained SDK target 207 and all four panel dimensions only
  in the Quest variant.
- Both optimized releases ran on the same physical Quest 3. They reported OS
  `2.7.0`, SDK `207`, and `isHorizonDevice: true`; `isHorizonBuild` matched each
  variant. The SDK 207 comparison returned `true`, with no fatal app error.

Headset resize-handle enforcement, older physical OS fallback paths, and
minimum-SDK installation restrictions remain unverified.
