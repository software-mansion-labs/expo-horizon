import React from 'react'
import { SafeAreaView, ScrollView } from 'react-native'
import { Section } from '../components/Section'
import ExpoQuest from 'expo-quest'
import { TestProperty } from '../components/TestProperty'
import { GlobalStyles } from '../constants/styles'

export default function QuestScreen() {
  return (
    <SafeAreaView style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={GlobalStyles.scrollContent}
      >
        <Section title="Quest">
          <TestProperty
            title="Is Quest Device"
            value={ExpoQuest.isQuestDevice.toString()}
          />
          <TestProperty
            title="Is Quest Build"
            value={ExpoQuest.isQuestBuild.toString()}
          />
          <TestProperty
            title="Quest App ID"
            value={ExpoQuest.questAppId?.toString() || 'Not set'}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}
