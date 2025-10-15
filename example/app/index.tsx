import React from 'react'
import { Text, TouchableOpacity, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import { GlobalStyles } from '../constants/styles'
export default function Index() {
  return (
    <SafeAreaView
      style={[GlobalStyles.centeredContainer, GlobalStyles.screenContainer]}
    >
      <Text style={GlobalStyles.pageTitle}>expo-quest demo</Text>
      <ModuleButton title="Quest Core" onPress={() => router.push('/quest')} />
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
