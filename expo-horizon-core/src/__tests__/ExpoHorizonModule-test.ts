import ExpoHorizon from '../ExpoHorizonModule.web';

it('reports no Horizon OS on web', () => {
  expect(ExpoHorizon.isHorizonDevice).toBe(false);
  expect(ExpoHorizon.horizonOsVersion).toBeNull();
});

it('reports the current SDK version as unavailable on web', () => {
  expect(ExpoHorizon.horizonSdkVersion).toBeNull();
});

it.each([61, 207, 2147483647])('reports SDK %s as unavailable on web', (version) => {
  expect(ExpoHorizon.isHorizonSdkVersionAtLeast(version)).toBe(false);
});

it.each([-1, 0, 60, 61.5, NaN, Infinity, -Infinity, 2147483648])(
  'returns false without validating SDK version %s on web',
  (version) => {
    expect(ExpoHorizon.isHorizonSdkVersionAtLeast(version)).toBe(false);
  }
);
