import { UnavailabilityError } from 'expo';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export async function getNotificationChannelGroupsAsync() {
    if (!NotificationChannelGroupManager.getNotificationChannelGroupsAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupsAsync');
    }
    return await NotificationChannelGroupManager.getNotificationChannelGroupsAsync();
}
//# sourceMappingURL=getNotificationChannelGroupsAsync.android.js.map