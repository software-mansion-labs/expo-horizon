import { UnavailabilityError } from 'expo';
import NotificationChannelManager from './NotificationChannelManager';
export async function getNotificationChannelsAsync() {
    if (!NotificationChannelManager.getNotificationChannelsAsync) {
        throw new UnavailabilityError('Notifications', 'getNotificationChannelsAsync');
    }
    return (await NotificationChannelManager.getNotificationChannelsAsync()) ?? [];
}
//# sourceMappingURL=getNotificationChannelsAsync.android.js.map