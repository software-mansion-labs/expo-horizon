import React, { useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View, Text, Alert } from 'react-native';

import { Colors } from '../constants/colors';
import { GlobalStyles } from '../constants/styles';

export const TestButton = ({
  title,
  onPress,
  color = Colors.swmNavy,
}: {
  title: string;
  onPress: () => Promise<void>;
  color?: string;
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const internalOnPress = async () => {
    try {
      setIsButtonLoading(true);
      await onPress();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Unknown error');
      console.error(error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        GlobalStyles.button,
        { backgroundColor: color },
        isButtonLoading && GlobalStyles.buttonDisabled,
      ]}
      onPress={() => internalOnPress()}
      disabled={isButtonLoading}>
      <View style={GlobalStyles.buttonContent}>
        {isButtonLoading && (
          <ActivityIndicator size="small" color="#fff" style={GlobalStyles.loadingIndicator} />
        )}
        <Text style={GlobalStyles.buttonText}>{isButtonLoading ? `${title}...` : title}</Text>
      </View>
    </TouchableOpacity>
  );
};
