# Changelog

## [Unreleased]
- Added UI testing framework with Playwright integration
- Added support for running tests against existing Brave browser session
- Added debug server for capturing extension logs
- Added test scenarios for basic navigation, vision testing, and complex interactions
- Added browser connection handling and extension popup automation

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