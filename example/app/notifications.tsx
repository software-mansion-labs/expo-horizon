import { Alert, SafeAreaView, ScrollView } from 'react-native'
import React from 'react'
import { Section } from '../components/Section'
import { TestButton } from '../components/TestButton'
import * as Notifications from 'expo-horizon-notifications'
import ExpoHorizon from 'expo-horizon-core'
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
        title: 'Hello Horizon OS!',
        body: 'This is a notification sent from Expo application!',
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
    Alert.alert('Push Token', result.data)
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
            onPress={async () => console.log(ExpoHorizon.isHorizonDevice)}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}
