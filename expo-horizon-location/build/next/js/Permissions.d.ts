import type { PermissionResponse } from 'expo';
import type { LocationPermissionResponse, RequestPermissionsOptions } from '../types';
/**
 * Checks the foreground location permission without asking the user.
 *
 * @return A promise that resolves to the current permission, including its scope and accuracy.
 */
export declare function getForegroundPermissions(): Promise<LocationPermissionResponse>;
/**
 * Asks the user for permission to read the location while the app is in the foreground.
 * Shows the system dialog only while the permission is undetermined; afterwards it resolves with
 * the current state, so check `canAskAgain` to know whether the user has to go to the system
 * settings.
 *
 * See [Request the precise location](#request-the-precise-location) and
 * [Handle a denied permission](#handle-a-denied-permission).
 *
 * @param options The accuracy to ask for.
 * @return A promise that resolves to the permission after the user answered.
 */
export declare function requestForegroundPermissions(options?: RequestPermissionsOptions): Promise<LocationPermissionResponse>;
/**
 * Checks the background location permission without asking the user.
 *
 * @return A promise that resolves to the current permission. `scope` is `always` when it is
 *   granted. `granted` is true only when the foreground permission is granted as well, while
 *   `status` reflects the background permission alone.
 */
export declare function getBackgroundPermissions(): Promise<LocationPermissionResponse>;
/**
 * Asks the user for permission to read the location while the app is in the background.
 * On Android, it throws when `ACCESS_BACKGROUND_LOCATION` is missing from the manifest or the
 * foreground permission is not granted. On iOS, answering **Keep Only While Using** resolves with
 * `status` `denied` and `scope` `whenInUse`.
 *
 * See [Request the background permission](#request-the-background-permission).
 *
 * @param options The accuracy to ask for
 * @return A promise that resolves to the permission after the user answered.
 */
export declare function requestBackgroundPermissions(options?: RequestPermissionsOptions): Promise<LocationPermissionResponse>;
/**
 * Checks the user's permission for posting notifications.
 * See [Start a background session](#start-a-background-session).
 *
 * @return A promise that fulfills with an object of type `PermissionResponse`.
 * @platform android
 */
export declare function getNotificationPermissions(): Promise<PermissionResponse>;
/**
 * Asks the user to grant the permission for posting notifications. On Android 12 and lower, no
 * dialog appears, and the result reports whether notifications are on for the app.
 *
 * See [Start a background session](#start-a-background-session).
 *
 * @return A promise that fulfills with an object of type `PermissionResponse`.
 * @platform android
 */
export declare function requestNotificationPermissions(): Promise<PermissionResponse>;
/**
 * Checks or requests the foreground location permission from a component.
 * See [Request the precise location](#request-the-precise-location).
 *
 * @example
 * ```tsx
 * const [permission, requestPermission] = useForegroundLocationPermissions();
 *
 * if (!permission?.granted) {
 *   return <Button title="Allow location" onPress={requestPermission} />;
 * }
 * ```
 */
export declare const useForegroundLocationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<RequestPermissionsOptions> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
/**
 * Checks or requests the background location permission from a component.
 * See [Request the background permission](#request-the-background-permission).
 *
 * @example
 * ```tsx
 * const [foreground, requestForeground] = useForegroundLocationPermissions();
 * const [background, requestBackground] = useBackgroundLocationPermissions();
 *
 * if (!foreground?.granted) {
 *   return <Button title="Allow location" onPress={requestForeground} />;
 * }
 * if (background?.scope !== LocationScope.ALWAYS) {
 *   return <Button title="Allow background location" onPress={requestBackground} />;
 * }
 * ```
 */
export declare const useBackgroundLocationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<RequestPermissionsOptions> | undefined) => [LocationPermissionResponse | null, () => Promise<LocationPermissionResponse>, () => Promise<LocationPermissionResponse>];
/**
 * Checks or requests the permission for posting notifications.
 * @platform android
 */
export declare const useNotificationPermissions: (options?: import("expo-modules-core").PermissionHookOptions<object> | undefined) => [PermissionResponse | null, () => Promise<PermissionResponse>, () => Promise<PermissionResponse>];
//# sourceMappingURL=Permissions.d.ts.map