# Horizon OS information and panel configuration verification

Validated on 2026-10-30 for PR #87, using implementation commit
`ade294f11749f98baa9010ce8f32d8cf1bb2e277` on `jtatar/horizon-sdk-versioning`.
That commit follows merge commit `6c72570c`, which incorporates main
`a0575d53f3872c867d131ef1c0b1f9eaf883c877`, including Expo 58.0.21 and React Native
0.88.1. These revisions belong to this branch's history. The final follow-up changes
documentation and release notes only.

Work used an isolated checkout. Unrelated notification/example edits in the
primary checkout were excluded and left untouched. No review-comment replies,
publication, release tags, or PR merge were performed.

## Changes verified

- Preserved SDK 58's required `supportedDevices` validation alongside the new
  optional Horizon SDK and panel minimum settings. The custom manifest helper no
  longer defaults to an invalid empty options object.
- Android comparison calls return `false` for integer SDK versions 1–60 without
  invoking Meta's compatibility library. Invalid values, including zero, negative
  values, fractions, non-finite numbers, and integer overflow, still throw.
- iOS and web comparisons throw `ERR_HORIZON_SDK_UNAVAILABLE`, with an explanation
  that SDK checks are Android-only. Their version constants remain `null`.
- Config-plugin minimum/target SDK values still require integers 61 or newer.
  A target lower than the minimum remains invalid.
- Replaced earlier verification records referring to rewritten commits with this
  record tied to the implementation that was actually tested.

## Automated checks

Node 24.9.0 and Yarn 1.22.22 were used, with Java 17 and Xcode 27.2 for native work.

| Check                                              | Result                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `yarn install --frozen-lockfile --non-interactive` | Pass after resolving the SDK 58 manifest-helper type conflict; lockfile unchanged                                                          |
| `CI=1 yarn verify`                                 | Pass: package/plugin builds, Oxlint, formatting, package/example types, 20 Jest suites, 189 passing tests, one existing skip, one snapshot |
| `yarn --cwd example expo install --check`          | Pass                                                                                                                                       |
| Clean Expo prebuild                                | Pass; no dependency changes                                                                                                                |
| Core Android native tests                          | 18 passed in mobileDebug and 18 passed in questDebug; no skips or failures                                                                 |
| Android mobileRelease and questRelease             | Pass with R8 explicitly enabled; both optimized APKs exercised on devices                                                                  |
| Unsigned iOS simulator build                       | Pass; native calls exercised on an iPhone 18 Pro Max simulator running iOS 27.0                                                            |
| Real web runtime                                   | Version constants and all nine unavailable-error cases pass; the example displays the error after pressing Check                           |

Native Android command, from `example/android`:

```sh
./gradlew --no-daemon --console=plain \
  :expo-horizon-core:testMobileDebugUnitTest \
  :expo-horizon-core:testQuestDebugUnitTest \
  :app:assembleMobileRelease :app:assembleQuestRelease \
  -Pandroid.enableMinifyInReleaseBuilds=true \
  -PreactNativeArchitectures=arm64-v8a
```

After `pod install`, iOS used:

```sh
xcodebuild -workspace expohorizondemo.xcworkspace \
  -scheme expohorizondemo -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/horizon-pr87-20261030/DerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

The computer lost power after the builds. Temporary build logs were cleared by
the restart, but both Android APKs, R8 output, native test reports, and the installed
iOS simulator app survived. Device checks resumed using those outputs, and
`yarn verify` was rerun after removing the temporary runtime probe. Remaining
evidence is saved outside the repository in
`/Users/jakubtatar/.codex/verification/pr87-20261030/`.

## Device results

The physical Quest 3 runs Horizon OS 2.7.0 / SDK 207, Android 14 / API 34. The
standard Android emulator runs API 37. Android tests used bundled JavaScript in
optimized release APKs and exercised the example's actual input and Check button
through UI Automator/ADB. No mock Horizon bridge was used.

| Check                          | Quest, questRelease | Quest, mobileRelease | Android emulator, mobileRelease |
| ------------------------------ | ------------------- | -------------------- | ------------------------------- |
| Horizon device flag            | `true`              | `true`               | `false`                         |
| Horizon build flag             | `true`              | `false`              | `false`                         |
| OS display version             | `2.7.0`             | `2.7.0`              | Unavailable                     |
| Current SDK version            | `207`               | `207`                | Unavailable                     |
| Compare 1 and 60               | `false`             | `false`              | `false`                         |
| Compare 61 and 207             | `true`              | `true`               | `false`                         |
| Compare 208 and 2147483647     | `false`             | `false`              | `false`                         |
| Compare 0, -1, and 61.5        | Validation error    | Validation error     | Validation error                |
| Compare 207 again after errors | `true`              | `true`               | `false`                         |

The app stayed responsive after invalid inputs. The Quest release was restored
after testing the mobile variant on the headset.

On iOS and web, a temporary JavaScript probe called the real exported module and
recorded constants and comparisons for 1, 60, 61, 207, 208, 2147483647, 0, -1, and
61.5. All calls threw `ERR_HORIZON_SDK_UNAVAILABLE`; OS/SDK constants were `null`
and both device/build flags were `false`. Web also displayed the expected error
through the example UI. The probe and its import were removed before final
verification; no test server or probe is included in the commit.

APK SHA-256 values:

- mobileRelease: `a65c4c93b5f158c760e7d18f283fcacf49d1328d97cb1a5d1c66850f2edbca5b`
- questRelease: `7c0d9a7ab0895dde101a29b07867474525482cdd3d135199dddd28a2c9f1b9c8`

## Panel and SDK declarations

The merged Quest manifest contains target SDK 207 and all four dimensions:
default width/height 1024/640dp and minimum width/height 600/400dp. The merged mobile
manifest contains neither the Meta SDK declaration nor a panel layout. Plugin
tests verify repeated output, changing/removing options, individual SDK settings,
minimum/target ordering, invalid values, and preservation of mobile configuration.

On the headset, Android reported the Quest app's initial configuration as
`w1024dp h640dp`, matching the declared defaults. Resize-handle enforcement and
minimum-size usability are not yet recorded as verified.

## Release notes and limits

Core has no package changelog. Its release handoff must include the OS/SDK fields,
official detector with legacy fallback, optional Quest SDK/panel configuration,
and the platform-specific comparison behavior above. Notification `Unpublished`
now records the Quest R8 build fix. Mechanical integration, tests, and evidence
updates require no additional package note.

Older physical Horizon OS fallback paths and minimum-SDK installation restrictions
remain unverified. This focused pass does not revalidate location tracking, real
Meta/FCM/APNs push, notification response handling, or physical iPhone behavior.
The unsigned iOS simulator still reports the known Keychain entitlement error
from push-registration storage; that does not affect the core SDK checks.
Release builds and native test passes do not establish store approval.
