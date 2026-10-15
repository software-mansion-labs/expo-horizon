import type { EventSubscription } from 'expo';
import { LocationProfile } from '../types';
import type { Position, PositionWatchError, PositionWatchStatus, WatchPositionParams } from '../types';
export declare class PositionWatchHandle {
    private readonly nativeHandle;
    constructor(profile?: LocationProfile);
    pause(): void;
    resume(): boolean;
    withProfile(profile: LocationProfile): this;
    withInterval(intervalSeconds: number): this;
    restart(): boolean;
    status(): PositionWatchStatus;
    dispose(): void;
    addListener(onPosition: (position: Position) => void, onError?: (error: PositionWatchError) => void): EventSubscription;
}
export declare function watchPosition({ profile, onPosition, onError, }: WatchPositionParams): PositionWatchHandle;
//# sourceMappingURL=PositionWatchHandle.d.ts.map