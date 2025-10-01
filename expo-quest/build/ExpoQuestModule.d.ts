import { NativeModule } from "expo";
declare class ExpoQuestModule extends NativeModule {
    /**
     * Returns true if the currently running device is a Quest device.
     * @platform android
     */
    isQuestDevice: boolean;
    /**
     * The Quest app ID configured in the config plugin. It is null if not set.
     * @platform android
     */
    questAppId: string | null;
}
declare const _default: ExpoQuestModule;
export default _default;
//# sourceMappingURL=ExpoQuestModule.d.ts.map