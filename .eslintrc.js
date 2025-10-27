module.exports = {
  root: true,

  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    node: true,
  },

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  rules: {},

  overrides: [
    {
      files: ['example/**/*.{ts,tsx,js,jsx}'],

      extends: ['@react-native'],
      env: {
        browser: true,
        'react-native/react-native': true,
      },
      rules: {},
    },
    {
      files: ['packages/**/*.{ts,tsx,js,jsx}'],
      rules: {},
    },
  ],

  ignorePatterns: ['node_modules/', 'dist/', 'build/', 'example/metro.config.js'],
};
