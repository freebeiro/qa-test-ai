#!/bin/bash

# Clean the dist directory
rm -rf dist/*

# Run webpack build
npm run build

# Copy any additional files needed
cp manifest.json dist/
cp popup.html dist/
cp -r icons dist/

echo "Build completed. Please reload the extension in Chrome."