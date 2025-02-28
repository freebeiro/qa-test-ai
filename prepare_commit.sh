#!/bin/bash
# Script to prepare the project for commit

# Set color variables
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Preparing project for commit...${NC}"

# Clean build artifacts
rm -rf dist

# Remove all unnecessary files and directories
echo -e "${YELLOW}Removing unnecessary files...${NC}"
find . -maxdepth 1 -type d ! -name "." ! -name ".git" ! -name "icons" ! -name "node_modules" -exec rm -rf {} \;
find . -maxdepth 1 -type f ! -name "package.json" ! -name "package-lock.json" ! -name "manifest.json" ! -name "popup.html" ! -name "popup.js" ! -name "background.js" ! -name "content.js" ! -name "command_processor.js" ! -name "styles.css" ! -name "webpack.config.js" ! -name "babel.config.js" ! -name "build.sh" ! -name ".gitignore" ! -name "prepare_commit.sh" -delete

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
  echo -e "${YELLOW}Creating .gitignore...${NC}"
  cat > .gitignore << 'EOF'
node_modules/
dist/
*.log
.DS_Store
EOF
fi

# Create simple README
echo -e "${YELLOW}Creating README.md...${NC}"
cat > README.md << 'EOF'
# QA Testing Assistant

A Chrome extension for QA testing with visual automation.

## Features

- Navigation with "go to url"
- Scrolling with "scroll up/down"
- Back/forward navigation
- Smart element clicking with "click [element]"
- Enter key presses with "press enter"
- Text typing (general and targeted)
- Screenshots after each command

## Installation

1. Run `./build.sh` to build the extension
2. Load from Chrome's extension page using the dist/ folder

## Commands

- `go to [url]` - Navigate to a website
- `type [text]` - Type text in the active input
- `type [text] in [field]` - Type in a specific field
- `click [text]` - Click element containing text
- `scroll up/down` - Scroll the page
- `back` / `forward` - Navigate history
- `press enter` - Press the Enter key
EOF

echo -e "${GREEN}✓ Project prepared for commit${NC}"
echo -e "${YELLOW}You can now run:${NC}"
echo -e "git add ."
echo -e "git commit -m \"Clean implementation of QA Testing Assistant\""
echo -e "git push"
