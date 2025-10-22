# Expo Horizon Example

This is an example app, that uses the `expo-horizon-location` and `expo-horizon-notifications` packages.

### Usage

```bash
yarn install # to install dependencies in all expo-horizon modules - only if needed
cd example
rm -rf android # (Optional) force prebuild by removing the `android` folder:
yarn # install dependencies
yarn quest # to run the app on Horizon, it uses `quest` build flavour
yarn android # to run the app on Android
yarn ios # to run the app on iOS
yarn web

# To perform a clean install (removes the `node_modules`, `ios`, and `android` folders):
yarn clean
```

> [!NOTE]
> When switching between `quest`/`android` targets, you need to prebuild the app to see changes reflected in the example app.
> When changing config in `app.config.ts`, you need to prebuild the app to see changes reflected in the example app.
