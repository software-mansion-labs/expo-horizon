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
notifications tests on iOS (including the existing export snapshot), and config
plugin tests in Node. The Horizon native bridge is mocked as a mobile device for
these JS tests; they do not establish Quest native behavior. The existing Android
Google Maps geocoding test remains skipped because it requires an API key.

The restored Xcode fixture and its test-path adjustment are recorded as exact,
reviewed differences in `upstream-allowances/verification-tests.json`. Review those
hashes and their pinned Expo commit when changing the fixture or upgrading the SDK.

Core plugin tests run Expo's mod compiler against temporary native files. They
check mobile/Quest permission separation, Quest options, and repeatable output,
including updating `horizonAppId`. Temporary files are removed after each test.
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
