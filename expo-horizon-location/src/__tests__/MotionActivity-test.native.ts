import { mockProperty, unmockAllProperties } from 'jest-expo';

import ExpoLocation from '../ExpoLocation';
import { getMotionActivityAsync } from '../Location';
import {
  _getCurrentWatchId,
  LocationErrorSubscriber,
  MotionActivitySubscriber,
} from '../LocationSubscribers';

const activity = { activities: ['stationary'], confidence: 'high', timestamp: 1 };
let startWatch: jest.Mock;
let removeWatch: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  startWatch = jest.fn().mockResolvedValue(undefined);
  removeWatch = jest.fn().mockResolvedValue(undefined);
  mockProperty(ExpoLocation, 'watchMotionActivityImplAsync', startWatch);
  mockProperty(ExpoLocation, 'removeWatchAsync', removeWatch);
});

afterEach(() => {
  // A native startup rejection does not return a subscription to the caller.
  MotionActivitySubscriber.forgetCallback(_getCurrentWatchId());
  LocationErrorSubscriber.forgetCallback(_getCurrentWatchId());
  jest.useRealTimers();
  unmockAllProperties();
});

it.each([undefined, 100])('handles an immediate activity with timeout %s', async (timeout) => {
  startWatch.mockImplementation(async (watchId) => {
    ExpoLocation.emit('Expo.motionActivityChanged', { watchId, activity });
  });

  await expect(getMotionActivityAsync({ timeout })).resolves.toEqual(activity);

  expect(removeWatch).toHaveBeenCalledTimes(1);
  expect(removeWatch).toHaveBeenCalledWith(_getCurrentWatchId());
  expect(jest.getTimerCount()).toBe(0);
});

it('times out and removes the native watch when no activity arrives', async () => {
  const pending = getMotionActivityAsync({ timeout: 100 });
  const rejection = expect(pending).rejects.toMatchObject({
    code: 'ERR_LOCATION_MOTION_ACTIVITY_TIMEOUT',
  });

  await jest.advanceTimersByTimeAsync(100);
  await rejection;

  expect(removeWatch).toHaveBeenCalledTimes(1);
  expect(removeWatch).toHaveBeenCalledWith(_getCurrentWatchId());
  expect(jest.getTimerCount()).toBe(0);
});

it('cleans up after an error callback and cancels the pending timeout', async () => {
  const pending = getMotionActivityAsync({ timeout: 100 });
  const rejection = expect(pending).rejects.toThrow('Motion provider failed');
  await jest.advanceTimersByTimeAsync(0);

  ExpoLocation.emit('Expo.locationError', {
    watchId: _getCurrentWatchId(),
    reason: 'Motion provider failed',
  });
  await rejection;

  expect(removeWatch).toHaveBeenCalledTimes(1);
  expect(jest.getTimerCount()).toBe(0);
});

it.each([0, -1, Infinity, NaN])(
  'rejects invalid timeout %s before starting a watch',
  async (timeout) => {
    await expect(getMotionActivityAsync({ timeout })).rejects.toMatchObject({
      code: 'ERR_LOCATION_INVALID_TIMEOUT',
    });
    expect(startWatch).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  }
);

it('preserves the Quest unavailable error instead of replacing it with a timeout', async () => {
  const error = Object.assign(new Error('Motion activity is unavailable'), {
    code: 'ERR_QUEST_FEATURE_UNAVAILABLE',
  });
  startWatch.mockRejectedValue(error);

  await expect(getMotionActivityAsync({ timeout: 100 })).rejects.toBe(error);
  expect(jest.getTimerCount()).toBe(0);
});
