import React from "react";
import { Text, TouchableOpacity, SafeAreaView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>expo-quest demo</Text>
      <ModuleButton title="Quest Core" onPress={() => router.push("/quest")} />
      <ModuleButton title="Location" onPress={() => router.push("/location")} />
      <ModuleButton title="Notifications" onPress={() => router.push("/notifications")} />
    </SafeAreaView>
  );
}

const ModuleButton = ({ title, onPress }: { title: string, onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
