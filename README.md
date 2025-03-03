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

## Code Structure

The codebase follows SOLID principles with a focus on Single Responsibility and is organized into directories by functionality:

### Directory Structure

- **src/background/**: Extension background scripts
  - `background.js`: Main background script entry point
  - `background-core.js`: Core background functionality

- **src/commands/**: Command handling and processing
  - `navigation-handlers.js`: URL navigation, back/forward
  - `input-handlers.js`: Text input and enter key handling
  - `ui-interaction-handlers.js`: Scrolling and clicking
  - `command_processor.js`: Command parsing and processing

- **src/content/**: Content scripts that run in web pages
  - `content.js`: Main content script entry point
  - `content-core.js`: Core content script functionality
  - `element-finder.js`: DOM element finding utilities
  - `element-actions.js`: DOM element interaction

- **src/ui/**: User interface components
  - `popup.js`: Main UI entry point
  - `popup-ui.js`: UI management
  - `chat-history.js`: Chat history display and management
  - `popup.html`: HTML structure
  - `styles.css`: UI styling

- **src/utils/**: Shared utilities
  - `chrome-api.js`: Chrome API abstraction layer
  - `background-utils.js`: Background script utilities
  - `content-utils.js`: Content script utilities
  - `screenshot.js`: Screenshot functionality

Each directory contains an `index.js` file that exports all components, making imports cleaner and more maintainable.

This modular structure improves testability and maintainability by separating concerns and keeping files small and focused.
