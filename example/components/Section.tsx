import React from 'react';
import { View, Text } from 'react-native';

import { GlobalStyles } from '../constants/styles';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={GlobalStyles.card}>
      <SectionTitle title={title} />
      {children}
    </View>
  );
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={GlobalStyles.sectionTitle}>{title}</Text>;
}
