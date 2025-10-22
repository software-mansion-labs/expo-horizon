import React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { GlobalStyles } from '../constants/styles'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index() {
  return (
    <SafeAreaView
      style={[GlobalStyles.centeredContainer, GlobalStyles.screenContainer]}
    >
      <Text style={GlobalStyles.pageTitle}>expo-horizon demo</Text>
      <ModuleButton
        title="Horizon Core"
        onPress={() => router.push('/horizon')}
      />
      <ModuleButton title="Location" onPress={() => router.push('/location')} />
      <ModuleButton
        title="Notifications"
        onPress={() => router.push('/notifications')}
      />
    </SafeAreaView>
  )
}

const ModuleButton = ({
  title,
  onPress,
}: {
  title: string
  onPress: () => void
}) => {
  return (
    <TouchableOpacity
      style={[GlobalStyles.button, GlobalStyles.buttonPrimary]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={GlobalStyles.buttonText}>{title}</Text>
    </TouchableOpacity>
  )
}
