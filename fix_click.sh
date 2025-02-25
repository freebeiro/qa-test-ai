#!/bin/bash

echo "🔧 Implementing click fix for QA Testing Assistant..."

# Clean dist directory
echo "🧹 Cleaning build directory..."
rm -rf dist/*

# Build with webpack
echo "🏗️ Building extension..."
npm run build

echo "✅ Build complete! Please reload the extension in Chrome."
echo "📝 This fix should resolve the clicking issue and improve the extension's stability."
