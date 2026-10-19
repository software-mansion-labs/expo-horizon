import type { BackgroundSessionOptions, BackgroundSessionStatus } from '../../types';
export declare class NativeBackgroundSessionClass {
    static ensureStarted(options?: BackgroundSessionOptions): Promise<void>;
    static stop(): Promise<void>;
    static status(): BackgroundSessionStatus;
}
//# sourceMappingURL=NativeBackgroundSessionClass.types.d.ts.map