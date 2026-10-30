import { UnavailabilityError } from 'expo';
import NotificationChannelGroupManager from './NotificationChannelGroupManager';
export async function deleteNotificationChannelGroupAsync(groupId) {
    if (!NotificationChannelGroupManager.deleteNotificationChannelGroupAsync) {
        throw new UnavailabilityError('Notifications', 'deleteNotificationChannelGroupAsync');
    }
    return await NotificationChannelGroupManager.deleteNotificationChannelGroupAsync(groupId);
}
//# sourceMappingURL=deleteNotificationChannelGroupAsync.android.js.map