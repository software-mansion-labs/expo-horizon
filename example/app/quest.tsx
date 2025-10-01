import React from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { Section } from "../components/Section";
import { TestButton } from "../components/TestButton";
import ExpoQuest from "expo-quest";

export default function QuestScreen() {
  const isQuestDevice = async () => {
    Alert.alert("Is Quest Device", ExpoQuest.isQuestDevice.toString());
  };

  const getQuestAppID = async () => {
    const questAppID = await ExpoQuest.questAppId;
    Alert.alert("Quest App ID", questAppID);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
      <Section title="Quest">
        <TestButton title="Is Quest Device" onPress={isQuestDevice} />
        <TestButton title="Get Quest App ID" onPress={getQuestAppID} />
      </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
});
