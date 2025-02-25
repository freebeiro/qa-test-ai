#!/bin/bash

echo "🧹 Cleaning up unnecessary files..."

# Remove temporary files
echo "Removing temporary build files..."
rm -f background.js.bak
rm -f background.js.original
rm -f webpack.config.js.bak

# Remove unused implementation files
echo "Removing unused implementation files..."
rm -f background_enhanced.js
rm -f background_impl.js
rm -f check_url_validation.js
rm -f command_handler.js
rm -f content_script_fallback.js
rm -f direct_command_executor.js
rm -f direct_execution_commands.js
rm -f fix_all_commands.sh
rm -f fix_extension.sh
rm -f fix_websocket_issue.sh
rm -f improved_element_finder.js
rm -f simplify_and_rebuild.sh

# Remove temporary markdown files
echo "Removing temporary documentation..."
rm -f DIRECT_EXECUTION_FIX.md
rm -f URL_VALIDATION_FIX.md

echo "✅ Cleanup complete!"
