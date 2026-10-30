/**
 * Lifecycle of the Android foreground service.
 * @platform android
 */
export var BackgroundSessionState;
(function (BackgroundSessionState) {
    /** No service is running, and none is being started or stopped. */
    BackgroundSessionState["NOT_RUNNING"] = "NOT_RUNNING";
    /**
     * The service is in transition. It is either starting and not yet promoted to the foreground, or
     * stopping and not yet destroyed.
     */
    BackgroundSessionState["PENDING"] = "PENDING";
    /**
     * The service is running in the foreground. On Android 13 and later, its notification appears
     * in the notification drawer only when the `android.permission.POST_NOTIFICATIONS` permission
     * is granted.
     */
    BackgroundSessionState["PROMOTED"] = "PROMOTED";
})(BackgroundSessionState || (BackgroundSessionState = {}));
//# sourceMappingURL=BackgroundSession.types.js.map