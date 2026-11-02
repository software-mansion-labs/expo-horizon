# Verification

From the repository root, use the Node version in `.nvmrc` and install with
`yarn install --frozen-lockfile`, then run:

```sh
yarn verify
```

This builds all packages and config plugins, runs the Oxlint and Prettier
checks, type-checks all packages and the example, and runs Jest once. It needs no
Android SDK, Xcode, device, or service credentials. Generated build output, Expo
caches, and the example's generated native projects are excluded from formatting.

CI runs the same commands as separate named steps. After dependencies install,
Oxlint and formatting still run if a build fails. Type checks and Jest require
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
checks on web, and config plugin tests in Node, including the location plugin.
Native suites use the SDK 58 Jest presets; plugin suites use Babel because the
upstream SWC export plugin is incompatible with the pinned SWC runtime. The Horizon
native bridge is mocked as a mobile device for these JS tests; they do not establish
Quest native behavior. The existing Android
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

| Input          | Expected result on Android                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------- |
| 1 or 60        | `false`; these SDK versions cannot be checked by the compatibility library.                     |
| 61             | `true` on a Quest with SDK 61 or newer; `false` on non-Horizon Android.                         |
| 207            | Matches whether the Quest's Meta VR OS SDK is 207 or newer, independent of Android's API level. |
| 2147483647     | `false` on current devices, without a crash.                                                    |
| 0, -1, or 61.5 | A validation error, without a crash.                                                            |

On iOS and web, every comparison call must throw `ERR_HORIZON_SDK_UNAVAILABLE`
with an explanation that Horizon OS SDK checks are only available on Android.
The version constants remain `null`. Verify that the example displays the error
and stays responsive.

Repeat with the mobile build on Quest: SDK availability must not depend on the
build flavor. Record the device, OS/SDK version, build variant, and results. The
example declares target SDK 207 but leaves the minimum unset so older Quest
releases can still exercise the runtime fallback. Inspect merged manifests to
confirm the Meta target appears only in the Quest build.

Current results, exact source revisions, APK hashes, and remaining limits are in
[Horizon OS information and panel configuration verification](horizon-os-sdk-verification.md).
