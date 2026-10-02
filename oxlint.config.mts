import base from 'expo-module-scripts/oxlint.config.base';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [base],
  // Oxlint does not inherit ignore patterns through extends.
  ignorePatterns: [
    ...base.ignorePatterns,
    '**/android/**',
    '**/ios/**',
    '**/assets/**',
    '**/bin/**',
    '**/fastlane/**',
    '**/kotlin/providers/**',
    '**/vendored/**',
    '**/metro.config.js',
    'docs/public/static/**',
  ],
});
