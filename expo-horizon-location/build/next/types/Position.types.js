/**
 * A use case that each platform turns into an accuracy, an update interval, and a power budget.
 *
 * On Android it maps to a `LocationRequest` priority, interval, batching, and a minimum distance
 * between updates. The mapping differs between the position watcher and background location
 * updates, which use longer intervals for most profiles.
 *
 * On iOS 17 and later it maps to a `CLLocationUpdate.LiveConfiguration`; on earlier versions to a
 * `CLLocationManager` activity type with the best available accuracy.
 */
export var LocationProfile;
(function (LocationProfile) {
    /**
     * General-purpose positioning, for anything the other profiles do not cover.
     *
     * On Android, balanced priority.
     *
     * On iOS, `CLLocationUpdate.LiveConfiguration.default`.
     */
    LocationProfile["DEFAULT"] = "default";
    /**
     * Turn-by-turn navigation in a vehicle.
     *
     * On Android, high accuracy with the most frequent updates.
     *
     * On iOS, `CLLocationUpdate.LiveConfiguration.automotiveNavigation`.
     */
    LocationProfile["AUTOMOTIVE_NAVIGATION"] = "automotiveNavigation";
    /**
     * Navigation on foot, by bike, or on water.
     *
     * On Android, high accuracy with frequent updates.
     *
     * On iOS, `CLLocationUpdate.LiveConfiguration.otherNavigation`.
     */
    LocationProfile["OTHER_NAVIGATION"] = "otherNavigation";
    /**
     * Workout tracking such as running or cycling.
     *
     * On Android, high accuracy with frequent updates.
     *
     * On iOS, `CLLocationUpdate.LiveConfiguration.fitness`.
     */
    LocationProfile["FITNESS"] = "fitness";
    /**
     * Flying, such as in a plane or a glider.
     *
     * On Android, high accuracy with the most frequent updates.
     *
     * On iOS, `CLLocationUpdate.LiveConfiguration.airborne`.
     */
    LocationProfile["AIRBORNE"] = "airborne";
    /**
     * Coarse position at the lowest power use.
     *
     * On Android, low-power priority with the least frequent updates, which the provider can delay
     * and deliver in batches. The Android provider requests it from `NETWORK_PROVIDER`, or from
     * `PASSIVE_PROVIDER` when `NETWORK_PROVIDER` is not available.
     *
     * On iOS, kilometer accuracy with a 3 km distance filter, on every iOS version.
     */
    LocationProfile["LOW_POWER"] = "lowPower";
})(LocationProfile || (LocationProfile = {}));
//# sourceMappingURL=Position.types.js.map