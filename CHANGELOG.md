# Changelog

## [Unreleased]
### Added
- Direct command execution mode that doesn't require Playwright service
- Robust element finder with multiple click strategies
- Reconnection logic for handling extension context invalidation
- Support for back, forward, and refresh browser commands
- Improved URL validation logic

### Fixed
- Fixed issue where clicks were not working properly on some elements
- Fixed "Extension context invalidated" errors with reconnection logic
- Fixed URL validation to correctly identify external websites
- Fixed navigation commands like "back" and "forward"
- Improved error handling and logging

### Changed
- Enhanced z-index management for reliable cursor display
- Improved cursor style enforcement with !important flags
- Added RequestAnimationFrame for better performance
- Streamlined extension architecture
- Updated manifest.json permissions and security policies
- Improved build process configuration
- Enhanced error handling and logging

### Removed
- Dependency on WebSocket connection to Playwright service
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