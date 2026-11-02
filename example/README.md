# Expo Horizon Example

This Expo SDK 58 example uses `expo-horizon-core`, `expo-horizon-location`, and
`expo-horizon-notifications` on Android mobile, Meta Quest, and iOS.

### Usage

```bash
nvm use # Node version from the repository's .nvmrc
yarn install --frozen-lockfile # from the repository root; installs all workspaces
cd example
yarn quest # to run the app on Horizon, it uses `quest` build flavor
yarn android # to run the app on Android
yarn ios # to run the app on iOS
yarn web

# To perform a clean install (removes the `node_modules`, `ios`, and `android` folders):
yarn clean
```

> [!NOTE]
> After changing `app.json`, `app.config.ts`, or config-plugin options, run
> `yarn expo prebuild --no-install` from `example/` and rebuild the affected platform.
> The generated Android project contains both `mobile` and `quest` flavors.
> Preserve intentional native edits before using `--clean` or `yarn clean`.

### Startup and testing

The custom `index.js` entry defines the location, geofence, and notification
tasks before loading Expo Router, including on headless launches. Keep task
definitions at startup rather than inside a screen component.

The demo ships with `DEMO_APP_ID` and no remote-push credentials. Local
notification testing does not establish remote push delivery. Configure your
Meta app, FCM, or APNs setup for remote push, and enable the relevant iOS
background modes before testing background tasks.

See the [verification guide](../docs/verification.md) for test procedures and
the [SDK 58 validation report](../docs/sdk58-release-validation.md) for completed
checks and remaining device limitations.
