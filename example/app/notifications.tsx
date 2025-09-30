import { Alert, SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";
import React from "react";
import { Section } from "../components/Section";
import { TestButton } from "../components/TestButton";
import * as Notifications from "expo-quest-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export default function NotificationsScreen() {
  const requestPermissions = async () => {
    const result = await Notifications.requestPermissionsAsync();
    console.log(result);
  };

  const getPermissions = async () => {
    const result = await Notifications.getPermissionsAsync();
    console.log(result);
  };

  const sendNotification = async () => {
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hello",
        body: "World",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    console.log(result);
  };

  const getPushToken = async () => {
    const result = await Notifications.getDevicePushTokenAsync();
    Alert.alert("Push Token", result.data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Section title="Permissions">
          <TestButton
            title="Request Permissions"
            onPress={requestPermissions}
            loadingKey="requestPermissions"
          />
          <TestButton
            title="Get Permissions"
            onPress={getPermissions}
            loadingKey="getPermissions"
          />
        </Section>
        <Section title="Local Notifications">
          <TestButton
            title="Send Notification"
            onPress={sendNotification}
            loadingKey="sendNotification"
          />
        </Section>
        <Section title="Remote Notifications">
          <TestButton
            title="Get Push Token"
            onPress={getPushToken}
            loadingKey="registerForRemoteNotifications"
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
});
