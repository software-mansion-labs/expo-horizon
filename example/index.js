import '@expo/metro-runtime';

// Headless launches must define tasks before any route or component is mounted.
import './location-tasks';
import './sections/notifications/background-task';

import 'expo-router/entry';
