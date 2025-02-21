# Project Structure

## Core Services
- `vision_service.js` - Vision analysis using Ollama API
- `browser_manager.js` - Browser tab management and window control

## Extension Components
- `background.js` - Chrome extension background script
- `popup.js` - Extension popup UI logic
- `popup.html` - Extension popup interface
- `manifest.json` - Extension configuration
- `content.js` - Content script for webpage interaction
- `styles.css` - UI styling

## Command System
- `command_processor.js` - Command execution engine
- `commands.js` - Basic command definitions
- `smart_commands.js` - AI-enhanced commands
- `vision_commands.js` - Vision-based interaction commands

## Build & Configuration
- `webpack.config.js` - Build configuration
- `package.json` - Project dependencies
- `.gitignore` - Source control exclusions

## Documentation
- `README.md` - Project overview and setup guide
- `IMPLEMENTATION.md` - Technical implementation details
- `TROUBLESHOOTING.md` - Common issues and solutions
- `CHANGELOG.md` - Version history
- `PROJECT_STRUCTURE.md` - Codebase organization
- `PROJECT_KNOWLEDGE.md` - Development guidelines

## Organization Strategy
1. Core Services: Modular services with clear responsibilities
2. Extension Components: Standard Chrome extension architecture
3. Command System: Unified command processing pipeline
4. Build & Config: Essential project configuration
5. Documentation: Comprehensive project documentation

## Key Features
1. Vision Analysis: Integration with Ollama vision model
2. Browser Control: Robust tab and window management
3. Command Processing: Extensible command system
4. UI/UX: Modern and responsive interface
5. Error Handling: Comprehensive error management

## Build Scripts
- `build.sh` - Main build script
- `rebuild.sh` - Clean rebuild script
- `commit.sh` - Git commit helper
- `webpack` - Webpack configuration

## Next Steps
1. Consolidate duplicate functionality
2. Remove unused files
3. Update import/export statements
4. Update build configuration
5. Document changes in CHANGELOG.md