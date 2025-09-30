import React, { useState } from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  View,
  StyleSheet,
  Text,
  Alert,
} from "react-native";

export const TestButton = ({
  title,
  onPress,
  color = "#007AFF",
  loadingKey,
}: {
  title: string;
  onPress: () => Promise<void>;
  color?: string;
  loadingKey?: string;
}) => {
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  const internalOnPress = async () => {
    try {
      setIsButtonLoading(true);
      await onPress();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unknown error");
      console.error(error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: color },
        isButtonLoading && styles.buttonDisabled,
      ]}
      onPress={() => internalOnPress()}
      disabled={isButtonLoading}
    >
      <View style={styles.buttonContent}>
        {isButtonLoading && (
          <ActivityIndicator
            size="small"
            color="#fff"
            style={styles.loadingIndicator}
          />
        )}
        <Text style={styles.buttonText}>
          {isButtonLoading ? `${title}...` : title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingIndicator: {
    marginRight: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
