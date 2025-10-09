import { NativeModule } from "expo";
declare class ExpoQuestModule extends NativeModule {
    /**
     * Returns true if the current device is a Quest device.
     */
    isQuestDevice: boolean;
    /**
     * Returns true if the current build is a Quest build.
     */
    isQuestBuild: boolean;
    /**
     * The Quest app ID configured via the config plugin. Returns null if not set.
     * Note: First check if you are on a Quest device using `isQuestDevice`.
     */
    questAppId: string | null;
}
declare const _default: ExpoQuestModule;
export default _default;
//# sourceMappingURL=ExpoQuestModule.d.ts.map