import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native'
import { Section } from '../components/Section'
import ExpoHorizon from 'expo-horizon-core'
import { TestProperty } from '../components/TestProperty'
import { GlobalStyles } from '../constants/styles'

export default function HorizonScreen() {
  return (
    <SafeAreaView style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={GlobalStyles.scrollContent}
      >
        <Section title="Horizon">
          <TestProperty
            title="Is Horizon Device"
            value={ExpoHorizon.isHorizonDevice.toString()}
          />
          <TestProperty
            title="Is Horizon Build"
            value={ExpoHorizon.isHorizonBuild.toString()}
          />
          <TestProperty
            title="Horizon App ID"
            value={ExpoHorizon.horizonAppId?.toString() || 'Not set'}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}
