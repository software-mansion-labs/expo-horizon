import ExpoHorizon from 'expo-horizon-core';
import React, { useState } from 'react';
import { Button, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '../components/Section';
import { TestProperty } from '../components/TestProperty';
import { GlobalStyles } from '../constants/styles';

export default function HorizonScreen() {
  const insets = useSafeAreaInsets();
  const [sdkVersion, setSdkVersion] = useState('');
  const [sdkResult, setSdkResult] = useState('Not checked');

  function checkSdkVersion() {
    try {
      const supported = ExpoHorizon.isHorizonSdkVersionAtLeast(Number(sdkVersion));
      setSdkResult(`SDK ${sdkVersion} or newer: ${supported}`);
    } catch (error) {
      setSdkResult(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <View style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingBottom: insets.bottom }]}>
        <Section title="Horizon">
          <TestProperty title="Is Horizon Device" value={ExpoHorizon.isHorizonDevice.toString()} />
          <TestProperty title="Is Horizon Build" value={ExpoHorizon.isHorizonBuild.toString()} />
          <TestProperty
            title="Horizon App ID"
            value={ExpoHorizon.horizonAppId?.toString() || 'Not set'}
          />
        </Section>
        <Section title="Horizon OS SDK">
          <TestProperty
            title="Current SDK version"
            value={ExpoHorizon.horizonSdkVersion?.toString() ?? 'Unavailable'}
          />
          <TextInput
            accessibilityLabel="Horizon SDK version"
            placeholder="Version (e.g. 207)"
            value={sdkVersion}
            onChangeText={setSdkVersion}
            keyboardType="numeric"
            style={[GlobalStyles.infoBox, { borderWidth: 1, minHeight: 48 }]}
          />
          <Button
            title="isHorizonSdkVersionAtLeast"
            onPress={checkSdkVersion}
            disabled={sdkVersion.trim().length === 0}
          />
          <TestProperty title="Result" value={sdkResult} />
        </Section>
      </ScrollView>
    </View>
  );
}
