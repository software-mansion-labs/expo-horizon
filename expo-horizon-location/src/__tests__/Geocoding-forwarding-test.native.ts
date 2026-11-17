import { geocode, reverseGeocode } from '../next/js/geocoding';
import { NativeLocationModuleNext } from '../next/native';

jest.mock('../next/native', () => ({
  NativeLocationModuleNext: {
    geocode: jest.fn(),
    reverseGeocode: jest.fn(),
  },
}));

const native = jest.mocked(NativeLocationModuleNext);

beforeEach(() => jest.resetAllMocks());

it('passes the requested locale to forward and reverse geocoding', async () => {
  native.geocode.mockResolvedValue([]);
  native.reverseGeocode.mockResolvedValue([]);
  const coordinates = { latitude: 38.8977, longitude: -77.0365 };
  const options = { locale: 'pl-PL' };

  await expect(geocode('Washington, DC', options)).resolves.toEqual([]);
  await expect(reverseGeocode(coordinates, options)).resolves.toEqual([]);
  expect(native.geocode).toHaveBeenCalledWith('Washington, DC', options);
  expect(native.reverseGeocode).toHaveBeenCalledWith(coordinates, options);
});

it.each(['ERR_QUEST_FEATURE_UNAVAILABLE', 'ERR_NO_GEOCODING_BACKEND', 'ERR_GEOCODING_UNAVAILABLE'])(
  'preserves the native %s error for callers',
  async (code) => {
    const error = Object.assign(new Error('Geocoding unavailable'), { code });
    native.geocode.mockRejectedValue(error);
    native.reverseGeocode.mockRejectedValue(error);

    await expect(geocode('Washington, DC')).rejects.toBe(error);
    await expect(reverseGeocode({ latitude: 38.8977, longitude: -77.0365 })).rejects.toBe(error);
  }
);
