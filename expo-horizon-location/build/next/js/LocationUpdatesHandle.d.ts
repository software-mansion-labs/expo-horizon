import type { TaskManagerError } from 'expo-task-manager';
import type { LocationProfile, Position } from '../types';
export declare class LocationUpdatesHandle {
    private readonly nativeHandle;
    constructor(taskName?: string);
    withProfile(profile: LocationProfile): this;
    start(): Promise<void>;
    stop(): Promise<void>;
    hasStarted(): Promise<boolean>;
}
export declare function defineLocationTask({ taskName, onPosition, onError, }: {
    taskName?: string;
    onPosition: (position: Position) => void;
    onError?: (error: TaskManagerError) => void;
}): void;
//# sourceMappingURL=LocationUpdatesHandle.d.ts.map