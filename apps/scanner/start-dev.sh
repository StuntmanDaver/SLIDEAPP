#!/bin/bash
# Development server startup script
# Unsets CI to allow interactive Metro bundler

# Unset CI environment variable (set by Cursor IDE)
unset CI

# Clear Metro cache if needed
if [ "$1" = "--clear" ] || [ "$1" = "-c" ]; then
  echo "🧹 Clearing caches..."
  rm -rf node_modules/.cache .expo/cache
  npx expo start --clear --port 8081
else
  echo "🚀 Starting Metro bundler..."
  npx expo start --port 8081
fi
