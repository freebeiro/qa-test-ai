#!/bin/bash

# Clean dist directory
rm -rf dist/*

# Run webpack build
npm run build

echo "Rebuilding extension... Please reload the extension in Chrome after this completes."