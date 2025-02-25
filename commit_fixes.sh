#!/bin/bash

echo "📝 Committing QA Testing Assistant fixes..."

# Make sure we're clean first
./cleanup.sh

# Add all files
git add .

# Commit with detailed message
git commit -m "fix: Implement direct command execution and fix click issues

- Added direct command execution that doesn't require Playwright service
- Fixed click commands with multi-strategy approach
- Added reconnection logic for extension context invalidation
- Fixed navigation commands (back, forward, refresh)
- Improved URL validation
- Enhanced error handling
- Updated documentation with detailed fix information
- Removed dependency on external services

This commit completely revamps the extension to work independently
without requiring any external services. Click commands now use multiple
strategies to ensure they work across different websites, and the extension
recovers gracefully from context invalidation."

echo "✅ Changes committed!"
