export var LocationScope;
(function (LocationScope) {
    /**
     * On Android, `ACCESS_BACKGROUND_LOCATION` is granted.
     *
     * On iOS, the authorization is `Always`.
     */
    LocationScope["ALWAYS"] = "always";
    /**
     * On Android, `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION` is granted, but not
     * `ACCESS_BACKGROUND_LOCATION`.
     *
     * On iOS, the authorization is `When In Use`.
     */
    LocationScope["WHEN_IN_USE"] = "whenInUse";
    /**
     * The app cannot read the location.
     */
    LocationScope["NOT_GRANTED"] = "notGranted";
})(LocationScope || (LocationScope = {}));
export var LocationAccuracy;
(function (LocationAccuracy) {
    /**
     * The app receives the precise location.
     *
     * On Android, `ACCESS_FINE_LOCATION` is granted.
     *
     * On iOS, **Precise Location** is turned on for the app.
     */
    LocationAccuracy["FULL"] = "full";
    /**
     * The app receives an approximate location, accurate to kilometers rather than meters.
     *
     * On Android, only `ACCESS_COARSE_LOCATION` is granted.
     *
     * On iOS, **Precise Location** is turned off for the app.
     */
    LocationAccuracy["REDUCED"] = "reduced";
    /**
     * The app cannot read the location.
     */
    LocationAccuracy["NOT_GRANTED"] = "notGranted";
})(LocationAccuracy || (LocationAccuracy = {}));
/**
 * The accuracy a permission request asks for.
 */
export var RequestPermissionsAccuracyOption;
(function (RequestPermissionsAccuracyOption) {
    /**
     * Asks for the precise location.
     *
     * On Android, requests `ACCESS_FINE_LOCATION` together with `ACCESS_COARSE_LOCATION`.
     *
     * On iOS, when the app holds a reduced accuracy, shows the system prompt for temporary full
     * accuracy after the permission is granted. The prompt needs the purpose string the config plugin
     * writes by default; `locationFullAccuracyPermission: false` removes it and skips the prompt.
     */
    RequestPermissionsAccuracyOption["FULL"] = "full";
    /**
     * Asks for an approximate location only.
     *
     * On Android, requests `ACCESS_COARSE_LOCATION` alone, so the system dialog does not offer the
     * precise option.
     *
     * On iOS, never asks to raise a reduced accuracy.
     */
    RequestPermissionsAccuracyOption["REDUCED"] = "reduced";
})(RequestPermissionsAccuracyOption || (RequestPermissionsAccuracyOption = {}));
//# sourceMappingURL=Permissions.types.js.map