import type { EventSubscription } from 'expo';
import { LocationProfile } from '../types';
import type { Position, PositionWatchError, PositionWatchStatus, WatchPositionParams } from '../types';
/**
 * Controls a running position watcher. Use `watchPosition()` to create one.
 *
 * On Android 8 and later, the watcher stops emitting fixes when the app is backgrounded and
 * resumes when it enters the foreground. A background session keeps it running in the background.
 * See [Start a background session](#start-a-background-session).
 *
 * See [Show live position on a screen](#show-live-position-on-a-screen).
 */
export declare class PositionWatchHandle {
    private readonly nativeHandle;
    /**
     * Creates a native watcher without a listener. On Android, it starts when the first listener is
     * added. On iOS, it starts right away. Prefer `watchPosition`, which also attaches the listener.
     *
     * @param profile The use case that selects the accuracy and the update rate.
     */
    constructor(profile?: LocationProfile);
    /**
     * Stops delivering positions and releases the system request, keeping the watcher for `resume()`.
     */
    pause(): void;
    /**
     * Requests positions again after `pause()`.
     *
     * @return `false` when the provider rejects the request right away. Later failures, including
     *   every failure on iOS and with Google Play services, arrive through `onError`.
     *   `true` means that no failure occurred, not that the watcher is subscribed. On Android, it
     *   also returns `true` when the watcher makes no request, for example while the app is in the
     *   background.
     * @throws After `dispose()`, like every other call on a disposed handle.
     */
    resume(): boolean;
    /**
     * Stages a new profile for the watcher. It has no effect until `restart()`. On Android it
     * overwrites an interval staged by an earlier `withInterval()`; call `withInterval()` afterwards
     * to set both.
     *
     * @return The same handle, for chaining.
     */
    withProfile(profile: LocationProfile): this;
    /**
     * Stages the time between two delivered positions, in seconds. It has no effect until
     * `restart()`. Positions arrive less often when the system has no new fix. `0` delivers every
     * position the system produces.
     *
     * On Android, it replaces the update interval the profile requests from the provider. On iOS, the
     * system decides the rate and positions that arrive sooner than the interval are dropped.
     *
     * @param intervalSeconds A finite number of seconds, `0` or greater. Throws for other values.
     * @return The same handle, for chaining.
     */
    withInterval(intervalSeconds: number): this;
    /**
     * Subscribes again with the settings staged by `withProfile()` and `withInterval()`.
     * It does not resume a paused watcher.
     *
     * @return `false` when the provider rejects the request right away. Later failures arrive through
     *   `onError`. `true` means that no failure occurred, not that the watcher is subscribed. On
     *   Android, it also returns `true` when the watcher makes no request, for example while the app
     *   is in the background.
     */
    restart(): boolean;
    /**
     * Reads the current flags of the watcher.
     */
    status(): PositionWatchStatus;
    /**
     * Removes all listeners and releases the native watcher.
     */
    dispose(): void;
    /**
     * Subscribes to the position and error events. One watcher can have multiple listeners.
     *
     * @param onPosition Called when a new position is delivered.
     * @param onError Called when an error occurs.
     * @return A subscription object with a `remove` method that stops listening for changes.
     */
    addListener(onPosition: (position: Position) => void, onError?: (error: PositionWatchError) => void): EventSubscription;
}
/**
 * Starts watching the position and returns the handle that controls the watcher.
 *
 * See [Show live position on a screen](#show-live-position-on-a-screen).
 *
 * @param options The profile and the callbacks for positions and errors.
 * @return The handle for controlling the watcher.
 * @throws When the foreground permission is not granted, when location services are off (iOS), or
 * when the selected provider cannot watch the position (Android).
 * @example
 * ```ts
 * const watcher = Location.watchPosition({
 *   profile: LocationProfile.FITNESS,
 *   onPosition: (position) => console.log(position.coordinates),
 *   onError: (error) => console.warn(error.code, error.message),
 * });
 *
 * // When the positions are no longer needed:
 * watcher.dispose();
 * ```
 */
export declare function watchPosition({ profile, onPosition, onError, }: WatchPositionParams): PositionWatchHandle;
//# sourceMappingURL=PositionWatchHandle.d.ts.map