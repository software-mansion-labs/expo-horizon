import React from 'react'
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native'
import { Section } from '../components/Section'
import ExpoQuest from 'expo-quest'
import { TestProperty } from '../components/TestProperty'

export default function QuestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
})
