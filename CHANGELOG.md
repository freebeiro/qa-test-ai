# Changelog

## [Unreleased]
### Added
- Enhanced browser window management with better error handling
- New documentation files (PROJECT_STRUCTURE.md, TROUBLESHOOTING.md)
- Improved content script integration
- UI testing framework with Playwright integration
- Support for running tests against existing Brave browser session
- Debug server for capturing extension logs
- Test scenarios for basic navigation, vision testing, and complex interactions
- Browser connection handling and extension popup automation

### Changed
- Streamlined extension architecture
- Updated manifest.json permissions and security policies
- Improved build process configuration
- Enhanced error handling and logging

### Removed
- Unused proxy and playwright services
- Legacy scripts and commands
- Redundant build scripts

## [1.0.0] - 2024-02-16

### Added
- Integration with Ollama's llama3.2-vision model for visual analysis
- New "test vision" command for analyzing webpage screenshots
- Enhanced documentation covering vision model integration
- Updated error handling for vision-related operations

### Changed
- Modified manifest.json to support Ollama API access
- Updated VisionService to handle base64 image encoding
- Improved error messages and logging
- Enhanced markdown documentation

### Technical Details
- Added CORS headers support for Ollama communication
- Implemented proper base64 image handling
- Added structured vision analysis response handling
- Updated build process to support new features

### Development Notes
- Requires Ollama to be running with CORS enabled
- Use `OLLAMA_ORIGINS="*" ollama serve` for development
- Vision model requires llama3.2-vision to be installed in Ollama