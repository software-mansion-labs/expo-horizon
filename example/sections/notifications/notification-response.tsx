import * as Notifications from 'expo-horizon-notifications';
import React from 'react';
import { Alert } from 'react-native';

import { Section } from '../../components/Section';
import { TestButton } from '../../components/TestButton';

export default function NotificationResponseSection() {
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  const getLastNotificationResponse = async () => {
    Alert.alert('Last Notification Response', JSON.stringify(lastNotificationResponse, null, 2));
  };

  const clearLastNotificationResponse = async () => {
    Notifications.clearLastNotificationResponse();
    Alert.alert('Last Notification Response Cleared');
  };

  return (
    <Section title="Last Notification Response">
      <TestButton title="Get Last Notification Response" onPress={getLastNotificationResponse} />
      <TestButton
        title="Clear Last Notification Response"
        onPress={clearLastNotificationResponse}
      />
    </Section>
  );
}
