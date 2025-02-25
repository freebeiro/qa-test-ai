#!/bin/bash
# This file was modified to ensure it's executable

echo "📦 Rebuilding QA Testing Assistant after URL validation fix..."

# Make script executable
chmod +x rebuild.sh

# Run the rebuild script
./rebuild.sh

echo "✅ Rebuild complete. Please reload the extension in Chrome."
echo "📝 See URL_VALIDATION_FIX.md for detailed information about the changes made."
