// Entry point for the consumer app
// CRITICAL: TextEncoder polyfill must be set BEFORE any other code
// This is required for react-native-qrcode-svg to work
// Using require() instead of import to prevent hoisting
require('text-encoding-polyfill');

// CRITICAL: Import global.css to ensure NativeWind styles are loaded before any component
require('./global.css');

// This file explicitly imports expo-router/entry to avoid pnpm resolution issues
require('expo-router/entry');
