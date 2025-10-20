# Expo Quest Example

This is an example app, that uses the `expo-quest-location` and `expo-quest-notifications` packages.

### Usage

```bash
yarn install # to install dependencies in all expo-quest modules - only if needed
cd example
rm -rf android # (Optional) force prebuild by removing the `android` folder:
yarn # install dependencies
yarn quest # to run the app on Quest, it uses `EXPO_HORIZON=1` environment variable
yarn android # to run the app on Android
yarn ios # to run the app on iOS
yarn web

# To perform a clean install (removes the `node_modules`, `ios`, and `android` folders):
yarn clean
```

> [!NOTE]
> When switching between `quest`/`android` targets, you need to prebuild the app to see changes reflected in the example app.
