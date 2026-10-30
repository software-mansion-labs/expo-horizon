import ExpoHorizon from '../ExpoHorizonModule.web';

it('reports no Horizon OS on web', () => {
  expect(ExpoHorizon.isHorizonDevice).toBe(false);
  expect(ExpoHorizon.horizonOsVersion).toBeNull();
});

it('reports the current SDK version as unavailable on web', () => {
  expect(ExpoHorizon.horizonSdkVersion).toBeNull();
});

it.each([1, 60, 61, 207, 2147483647, -1, 0, 61.5, NaN, Infinity, -Infinity, 2147483648])(
  'throws a platform availability error for SDK version %s on web',
  (version) => {
    expect(() => ExpoHorizon.isHorizonSdkVersionAtLeast(version)).toThrow(
      expect.objectContaining({
        code: 'ERR_HORIZON_SDK_UNAVAILABLE',
        message: 'Horizon OS SDK checks are only available on Android.',
      })
    );
  }
);
