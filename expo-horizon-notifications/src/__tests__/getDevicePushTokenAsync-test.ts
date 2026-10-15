import { Platform } from 'expo-modules-core';

jest.mock('../PushTokenManager', () => ({
  __esModule: true,
  default: { getDevicePushTokenAsync: jest.fn() },
}));
jest.mock('../warnOfExpoGoPushUsage', () => ({ warnOfExpoGoPushUsage: jest.fn() }));

describe.each([
  { device: 'Horizon', isHorizonDevice: true, tokenType: 'horizon' },
  { device: 'mobile', isHorizonDevice: false, tokenType: Platform.OS },
])('getDevicePushTokenAsync on $device', ({ isHorizonDevice, tokenType }) => {
  let getDevicePushTokenAsync: typeof import('../getDevicePushTokenAsync').getDevicePushTokenAsync;
  let register: jest.MockedFunction<() => Promise<string>>;

  beforeEach(() => {
    // Reset the module's cached promise so each test starts with a fresh registration.
    jest.resetModules();
    const { default: horizon } = jest.requireMock('expo-horizon-core');
    horizon.isHorizonDevice = isHorizonDevice;
    const { default: manager } = jest.requireMock('../PushTokenManager');
    register = manager.getDevicePushTokenAsync as typeof register;
    ({ getDevicePushTokenAsync } = jest.requireActual('../getDevicePushTokenAsync'));
  });

  it('retries native registration after a temporary failure', async () => {
    const error = new Error('Temporary registration failure');
    register.mockRejectedValueOnce(error).mockResolvedValueOnce('retry-token');

    await expect(getDevicePushTokenAsync()).rejects.toBe(error);
    await expect(getDevicePushTokenAsync()).resolves.toEqual({
      type: tokenType,
      data: 'retry-token',
    });
    expect(register).toHaveBeenCalledTimes(2);
  });

  it('shares an in-flight registration and requests a fresh token after success', async () => {
    register.mockResolvedValueOnce('shared-token').mockResolvedValueOnce('fresh-token');

    const first = getDevicePushTokenAsync();
    const second = getDevicePushTokenAsync();
    expect(register).toHaveBeenCalledTimes(1);
    await expect(Promise.all([first, second])).resolves.toEqual([
      { type: tokenType, data: 'shared-token' },
      { type: tokenType, data: 'shared-token' },
    ]);

    await expect(getDevicePushTokenAsync()).resolves.toEqual({
      type: tokenType,
      data: 'fresh-token',
    });
    expect(register).toHaveBeenCalledTimes(2);
  });

  it('shares the original failure with concurrent callers and allows a shared retry', async () => {
    const error = new Error('Temporary registration failure');
    register.mockRejectedValueOnce(error).mockResolvedValueOnce('retry-token');

    const first = getDevicePushTokenAsync();
    const second = getDevicePushTokenAsync();
    expect(register).toHaveBeenCalledTimes(1);
    const results = await Promise.allSettled([first, second]);
    for (const result of results) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe(error);
      }
    }

    await expect(
      Promise.all([getDevicePushTokenAsync(), getDevicePushTokenAsync()])
    ).resolves.toEqual([
      { type: tokenType, data: 'retry-token' },
      { type: tokenType, data: 'retry-token' },
    ]);
    expect(register).toHaveBeenCalledTimes(2);
  });
});
