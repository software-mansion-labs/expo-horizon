import { NativeLocationUpdatesHandle } from '../native';
const DEFAULT_LOCATION_TASK_NAME = 'expo-location-background-location';
export class LocationUpdatesHandle {
    nativeHandle;
    constructor(taskName = DEFAULT_LOCATION_TASK_NAME) {
        this.nativeHandle = new NativeLocationUpdatesHandle(taskName);
    }
    withProfile(profile) {
        this.nativeHandle.withProfile(profile);
        return this;
    }
    start() {
        return this.nativeHandle.start();
    }
    stop() {
        return this.nativeHandle.stop();
    }
    hasStarted() {
        return this.nativeHandle.hasStarted();
    }
}
export function defineLocationTask({ taskName = DEFAULT_LOCATION_TASK_NAME, onPosition, onError, }) {
    requireTaskManager().defineTask(taskName, async ({ data, error }) => {
        if (error) {
            onError?.(error);
            return;
        }
        onPosition(data);
    });
}
function requireTaskManager() {
    try {
        return require('expo-task-manager');
    }
    catch {
        throw new Error("defineLocationTask couldn't define the background location task because the 'expo-task-manager' package isn't installed. Background location updates are delivered through it. Install it with `npx expo install expo-task-manager` and rebuild the app.");
    }
}
//# sourceMappingURL=LocationUpdatesHandle.js.map