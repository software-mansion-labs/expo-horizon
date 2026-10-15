import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';
export declare function getForegroundPermissions(): Promise<LocationPermissionResponse>;
export declare function requestForegroundPermissions(options?: RequestPermissionsOptions): Promise<LocationPermissionResponse>;
export declare function getBackgroundPermissions(): Promise<LocationPermissionResponse>;
export declare function requestBackgroundPermissions(options?: RequestPermissionsOptions): Promise<LocationPermissionResponse>;
export declare const useForegroundLocationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<RequestPermissionsOptions> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
export declare const useBackgroundLocationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<RequestPermissionsOptions> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
//# sourceMappingURL=Permissions.d.ts.map