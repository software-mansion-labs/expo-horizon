/* eslint-env jest */
// The Horizon native bridge is unavailable in Jest. Native suites model a mobile device.
jest.mock('expo-horizon-core', () => ({
  __esModule: true,
  default: { isHorizonDevice: false, isHorizonBuild: false, horizonAppId: null },
}));
