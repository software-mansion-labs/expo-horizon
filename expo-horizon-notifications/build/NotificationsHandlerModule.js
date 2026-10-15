import { Platform } from 'expo';
let warningHasBeenShown = false;
export default {
    addListener: () => {
        if (!warningHasBeenShown) {
            console.warn(`[expo-notifications] Notifications handling is not yet fully supported on ${Platform.OS}. Handling notifications will have no effect.`);
            warningHasBeenShown = true;
        }
        return {
            remove: () => { },
        };
    },
    removeListener: () => { },
    removeAllListeners: () => { },
    emit: () => { },
    listenerCount: () => 0,
};
//# sourceMappingURL=NotificationsHandlerModule.js.map