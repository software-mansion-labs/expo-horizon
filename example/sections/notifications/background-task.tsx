import { Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Section } from '../../components/Section';
import { TestButton } from '../../components/TestButton';
import * as Notifications from 'expo-horizon-notifications';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TestText } from '../../components/TestText';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
const COUNTER_KEY = '@notification_counter';

// Define the background task handler
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    if (error) {
      console.error('Background task error:', error);
      return;
    }

    console.log('Background notification task received:', data);

    // Check if this is a notification response (user clicked on notification)
    const isNotificationResponse = 'actionIdentifier' in data;

    if (isNotificationResponse) {
      console.log('User clicked on notification in background!');

      // Increment the counter
      try {
        const currentCount = await AsyncStorage.getItem(COUNTER_KEY);
        const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
        await AsyncStorage.setItem(COUNTER_KEY, newCount.toString());
        console.log(`Counter incremented to: ${newCount}`);
      } catch (err) {
        console.error('Error updating counter:', err);
      }
    } else {
      console.log('Notification received in background (not clicked)');
    }
  }
);

const registerBackgroundTask = async () => {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background notification task registered');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
};

const unregisterBackgroundTask = async () => {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background notification task unregistered');
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
};

export default function BackgroundTaskSection() {
  const [counter, setCounter] = useState<number>(0);

  // Load counter on mount and when notification is received
  useEffect(() => {
    loadCounter();
  }, []);

  const loadCounter = async () => {
    try {
      const value = await AsyncStorage.getItem(COUNTER_KEY);
      setCounter(value ? parseInt(value, 10) : 0);
    } catch (error) {
      console.error('Error loading counter:', error);
    }
  };

  const resetCounter = async () => {
    try {
      await AsyncStorage.setItem(COUNTER_KEY, '0');
      setCounter(0);
      Alert.alert('Success', 'Counter has been reset to 0');
    } catch (error) {
      console.error('Error resetting counter:', error);
      Alert.alert('Error', 'Failed to reset counter');
    }
  };
  return (
    <Section title="Background Notification Counter">
      <TestText text={`Notifications clicked in background: ${counter}`} />
      <TestButton title="Register Background Task" onPress={registerBackgroundTask} />
      <TestButton title="Unregister Background Task" onPress={unregisterBackgroundTask} />
      <TestButton title="Refresh Counter" onPress={loadCounter} />
      <TestButton title="Reset Counter" onPress={resetCounter} />
    </Section>
  );
}
