# Project Structure

## Core Services
- `vision_service.js` - Vision analysis using Ollama API
- `qa_service.js` - Main QA testing service
- `browser_manager.js` - Browser tab management

## Extension Components
- `background.js` - Chrome extension background script
- `popup.js` - Extension popup UI logic
- `popup.html` - Extension popup interface
- `manifest.json` - Extension configuration
- `styles.css` - UI styling

## Command System
- `command_processor.js` - Command execution engine
- `command_factory.js` - Command creation and management
- `commands.js` - Basic command definitions
- `smart_commands.js` - AI-enhanced commands

## Build & Configuration
- `webpack.config.js` - Build configuration
- `build.sh` - Build script
- `package.json` - Project dependencies

## Documentation
- `README.md` - Project overview
- `IMPLEMENTATION.md` - Implementation details
- `TROUBLESHOOTING.md` - Common issues and solutions
- `CHANGELOG.md` - Version history

## Build Scripts
- `build.sh` - Main build script
- `rebuild.sh` - Clean rebuild script
- `commit.sh` - Git commit helper
- `webpack` - Webpack configuration

## Organization Strategy
1. Core Services: Keep these separate as they handle distinct responsibilities
2. Extension Components: Standard Chrome extension structure
3. Command System: Unified approach to handling user actions
4. Build & Config: Essential project setup files
5. Documentation: Comprehensive project information

## Next Steps
1. Consolidate duplicate functionality
2. Remove unused files
3. Update import/export statements
4. Update build configuration
5. Document changes in CHANGELOG.md