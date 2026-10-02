import * as Notifications from 'expo-horizon-notifications';
import React from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '../components/Section';
import { TestButton } from '../components/TestButton';
import { GlobalStyles } from '../constants/styles';
import BackgroundTaskSection from '../sections/notifications/background-task';
import NotificationResponseSection from '../sections/notifications/notification-response';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const requestPermissions = async () => {
    try {
      const result = await Notifications.requestPermissionsAsync();
      Alert.alert('Permissions', JSON.stringify(result, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not request permissions', message);
    }
  };

  const getPermissions = async () => {
    try {
      const result = await Notifications.getPermissionsAsync();
      Alert.alert('Permissions', JSON.stringify(result, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not get permissions', message);
    }
  };

  const sendNotification = async () => {
    try {
      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hello',
          body: 'World',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
        },
      });
      Alert.alert('Notification Scheduled', `Identifier: ${result}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not send notification', message);
    }
  };

  const scheduleDateNotification = async (delivery: Notifications.NotificationDelivery) => {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Scheduled reminder',
          body: 'Your two-minute reminder is ready.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(Date.now() + 120_000),
          delivery,
        },
      });
      Alert.alert(
        'Reminder scheduled',
        `Identifier: ${identifier}\n${
          delivery === 'alarmClock'
            ? 'For precise delivery, allow Alarms & reminders for this app in system settings. Without access, delivery is best effort.'
            : 'Delivery may be delayed by battery-saving settings.'
        }`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not schedule reminder', message);
    }
  };

  const getPushToken = async () => {
    try {
      const result = await Notifications.getDevicePushTokenAsync();
      Alert.alert('Push Token', JSON.stringify(result, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not get push token', message);
    }
  };

  return (
    <View style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingBottom: insets.bottom }]}>
        <Section title="Permissions">
          <TestButton title="Request Permissions" onPress={requestPermissions} />
          <TestButton title="Get Permissions" onPress={getPermissions} />
        </Section>
        <Section title="Local Notifications">
          <TestButton title="Send Notification" onPress={sendNotification} />
          <TestButton
            title="Schedule Two-Minute Reminder"
            onPress={() => scheduleDateNotification('bestEffort')}
          />
          {Platform.OS === 'android' && (
            <TestButton
              title="Schedule Two-Minute Alarm"
              onPress={() => scheduleDateNotification('alarmClock')}
            />
          )}
        </Section>
        <NotificationResponseSection />
        <BackgroundTaskSection />
        <Section title="Remote Notifications">
          <TestButton title="Get Push Token" onPress={getPushToken} />
        </Section>
      </ScrollView>
    </View>
  );
}
