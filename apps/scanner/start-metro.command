#!/bin/bash
# Run this script by double-clicking in Finder, or from Terminal:
#   cd /Users/davidk/SlideApp/slide/apps/scanner && ./start-metro.command

cd "$(dirname "$0")"

echo "🚀 Starting Slide Scanner Development Server"
echo "============================================"
echo ""

# Unset CI variable that causes issues
unset CI

# Clear caches on first run
if [ "$1" = "--clear" ] || [ "$1" = "-c" ]; then
  echo "🧹 Clearing caches..."
  rm -rf node_modules/.cache .expo/cache
fi

# Reset watchman
watchman watch-del "$(pwd)/../.." 2>/dev/null || true
watchman watch-del-all 2>/dev/null || true

echo "📦 Starting Metro bundler on port 8081..."
echo ""

npx expo start --port 8081

# Keep terminal open if there's an error
read -p "Press Enter to close..."
