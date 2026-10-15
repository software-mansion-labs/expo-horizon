import { NativeLocationModuleNext } from '../native';
import { LocationProfile } from '../types';
export class PositionWatchHandle {
    nativeHandle;
    constructor(profile = LocationProfile.DEFAULT) {
        this.nativeHandle = NativeLocationModuleNext.watchPosition(profile);
    }
    pause() {
        this.nativeHandle.pause();
    }
    resume() {
        return this.nativeHandle.resume();
    }
    withProfile(profile) {
        this.nativeHandle.withProfile(profile);
        return this;
    }
    withInterval(intervalSeconds) {
        this.nativeHandle.withInterval(intervalSeconds);
        return this;
    }
    restart() {
        return this.nativeHandle.restart();
    }
    status() {
        return this.nativeHandle.status();
    }
    dispose() {
        this.nativeHandle.removeAllListeners('positionChanged');
        this.nativeHandle.release();
    }
    addListener(onPosition, onError) {
        return this.nativeHandle.addListener('positionChanged', ({ data, error }) => {
            if (error != null) {
                onError?.(error);
                return;
            }
            if (data != null) {
                onPosition(data);
            }
        });
    }
}
export function watchPosition({ profile = LocationProfile.DEFAULT, onPosition, onError, }) {
    const handle = new PositionWatchHandle(profile);
    handle.addListener(onPosition, onError);
    return handle;
}
//# sourceMappingURL=PositionWatchHandle.js.map