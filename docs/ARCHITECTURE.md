# QA Testing Assistant Architecture

## Overview

The QA Testing Assistant is a Chrome extension designed to help QA testers automate common testing tasks through a simple command interface. The extension follows SOLID principles and is organized into a modular directory structure.

## Directory Structure

The codebase is organized into the following directories:

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

## Core Components

### Command Processing Flow

1. User enters a command in the popup UI
2. Command is sent to the background script
3. Background script parses the command and selects the appropriate handler
4. Handler executes the command, often by sending a message to the content script
5. Content script performs the action in the web page
6. Results are sent back to the background script and then to the popup UI

### Navigation History Tracking

The extension tracks navigation history for each tab to enable back/forward navigation:

1. `trackNavigation` function in `background-utils.js` stores URLs in a tab-specific history array
2. `getNavigationHistory` function retrieves the history for a specific tab
3. `createNavigationHandler` in `chrome-navigation.js` uses this history for back/forward navigation

### Chrome API Abstraction

The extension uses a Chrome API abstraction layer to improve testability:

1. `chrome-api.js` provides a simplified interface to the Chrome Extension API
2. This allows for easy mocking in tests
3. Additional utility functions handle common Chrome API tasks

## SOLID Principles Implementation

- **Single Responsibility**: Each file has a clear, focused purpose
- **Open/Closed**: Command handlers can be extended without modifying existing code
- **Liskov Substitution**: Chrome API abstraction allows for substitution in tests
- **Interface Segregation**: Command handlers have specific interfaces for their functionality
- **Dependency Inversion**: High-level modules depend on abstractions, not concrete implementations 