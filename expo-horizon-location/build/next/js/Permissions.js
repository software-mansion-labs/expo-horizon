import { createPermissionHook } from 'expo-modules-core';
import { NativeLocationModuleNext } from '../native';
export async function getForegroundPermissions() {
    return NativeLocationModuleNext.getForegroundPermissions();
}
export async function requestForegroundPermissions(options) {
    return NativeLocationModuleNext.requestForegroundPermissions(options);
}
export async function getBackgroundPermissions() {
    return NativeLocationModuleNext.getBackgroundPermissions();
}
export async function requestBackgroundPermissions(options) {
    return NativeLocationModuleNext.requestBackgroundPermissions(options);
}
export const useForegroundLocationPermissions = createPermissionHook({
    getMethod: getForegroundPermissions,
    requestMethod: requestForegroundPermissions,
});
export const useBackgroundLocationPermissions = createPermissionHook({
    getMethod: getBackgroundPermissions,
    requestMethod: requestBackgroundPermissions,
});
//# sourceMappingURL=Permissions.js.map