import ExpoHorizon from '../ExpoHorizonModule.web';

it.each([61, 207, 2147483647])('reports SDK %s as unavailable on web', (version) => {
  expect(ExpoHorizon.isHorizonSdkVersionAtLeast(version)).toBe(false);
});

it.each([-1, 0, 60, 61.5, NaN, Infinity, -Infinity, 2147483648])(
  'rejects invalid SDK version %s on web',
  (version) => {
    expect(() => ExpoHorizon.isHorizonSdkVersionAtLeast(version)).toThrow(RangeError);
  }
);
