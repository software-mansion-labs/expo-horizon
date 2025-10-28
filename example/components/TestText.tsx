import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { Colors } from '../constants/colors';

export const TestText = ({ text }: { text: string }) => {
  return <Text style={styles.text}>{text}</Text>;
};

const styles = StyleSheet.create({
  text: {
    color: Colors.swmNavy,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
});
