import { Alert, SafeAreaView, ScrollView } from 'react-native'
import React from 'react'
import { Section } from '../components/Section'
import { TestButton } from '../components/TestButton'
import * as Notifications from 'expo-quest-notifications'
import ExpoQuest from 'expo-quest'
import { GlobalStyles } from '../constants/styles'

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }
  },
})

export default function NotificationsScreen() {
  const requestPermissions = async () => {
    const result = await Notifications.requestPermissionsAsync()
    console.log(result)
  }

  const getPermissions = async () => {
    const result = await Notifications.getPermissionsAsync()
    console.log(result)
  }

  const sendNotification = async () => {
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hello',
        body: 'World',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    })
    console.log(result)
  }

  const getPushToken = async () => {
    const result = await Notifications.getDevicePushTokenAsync()
    const stringifiedResult = JSON.stringify(result, null, 2)
    Alert.alert('Push Token', stringifiedResult)
    console.log(stringifiedResult)
  }

  return (
    <SafeAreaView style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={GlobalStyles.scrollContent}
      >
        <Section title="Permissions">
          <TestButton
            title="Request Permissions"
            onPress={requestPermissions}
          />
          <TestButton title="Get Permissions" onPress={getPermissions} />
        </Section>
        <Section title="Local Notifications">
          <TestButton title="Send Notification" onPress={sendNotification} />
        </Section>
        <Section title="Remote Notifications">
          <TestButton title="Get Push Token" onPress={getPushToken} />
          <TestButton
            title="Get Device Token"
            onPress={async () => console.log(ExpoQuest.isQuestDevice)}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}
