import React from 'react';
import { View, Text } from 'react-native';

import { GlobalStyles } from '../constants/styles';

export const TestProperty = ({ title, value }: { title: string; value: string }) => {
  return (
    <View style={GlobalStyles.contentContainer}>
      <Text style={GlobalStyles.itemTitle}>{title}:</Text>
      <Text>{value}</Text>
    </View>
  );
};
