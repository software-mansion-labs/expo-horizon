# Changelog

This is a historical record retained from before SDK 58; it is unchanged from
the published 57.0.3 source. The `Unpublished` heading below is part of that
record, not a list of pending 58.0.0 changes. Current release notes, including
Horizon-specific fixes, are maintained in [CHANGELOG.md](CHANGELOG.md).

## Unpublished

### 🛠 Breaking changes

- On Horizon OS (Quest devices), the runtime push token `type` has changed from `'android'` to `'horizon'`. Apps that inspect or branch on the token `type` may need to update their handling logic accordingly.

### 🎉 New features

- Support for getting device push token on Horizon OS using the Kotlin API ([#22](https://github.com/software-mansion-labs/expo-horizon/pull/22) by [@kosmydel](https://github.com/kosmydel))

### 🐛 Bug fixes

### 💡 Others
