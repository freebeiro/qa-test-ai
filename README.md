# QA Testing Assistant Chrome Extension

A Chrome extension designed to assist QA testers by automating common testing tasks and providing a simple command interface.

## Latest Updates

- Improved tab management and screenshot reliability
- Enhanced element finding and click functionality
- Added support for UI-TARS integration
- Implemented robust error handling
- Added comprehensive technical documentation

## Features

- **Smart Navigation**: Automatically navigates to specified URLs with intelligent tab management
- **Reliable Screenshots**: Captures high-quality screenshots from the correct tab
- **Intelligent Click Detection**: Finds and clicks elements using a priority-based approach
- **Error Recovery**: Comprehensive error handling with clear feedback
- **UI-TARS Ready**: Prepared for integration with UI-TARS for advanced automation

## Key Commands

1. **Navigation**:
   ```
   go to [URL]
   ```
   Navigates to the specified URL in a controlled tab

2. **Click**:
   ```
   click [element text]
   ```
   Finds and clicks elements containing the specified text

3. **Screenshot**:
   ```
   screenshot
   ```
   Captures a screenshot of the current tab

## Technical Architecture

The extension follows SOLID principles and uses a modular architecture:

- **Command Pattern**: Extensible command system for easy feature addition
- **Factory Pattern**: Flexible command creation and validation
- **Strategy Pattern**: Smart element finding with priority matching
- **Observer Pattern**: Event-based state management

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for detailed technical documentation.

## Prerequisites

- Chrome Browser (Latest Version)
- Node.js and npm (for development)
- UI-TARS (optional, for advanced automation)

## Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Load the extension in Chrome:
   - Open chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Development

1. Make changes to the source code
2. Run tests: `npm test`
3. Build the extension: `npm run build`
4. Reload the extension in Chrome

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See LICENSE file for details