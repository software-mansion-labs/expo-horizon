import { UnavailabilityError } from 'expo';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export async function getNotificationChannelGroupAsync(groupId) {
    if (!NotificationChannelGroupManager.getNotificationChannelGroupAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationChannelGroupAsync');
    }
    return await NotificationChannelGroupManager.getNotificationChannelGroupAsync(groupId);
}
//# sourceMappingURL=getNotificationChannelGroupAsync.android.js.map