# QA Testing Assistant

Chrome extension for automated testing with vision model integration.

## Requirements

- Node.js 14+
- Chrome browser
- Ollama with llama3.2-vision model

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Build Extension**
```bash
npm run build
```

3. **Load in Chrome**
- Open chrome://extensions/
- Enable Developer mode
- Load unpacked -> select dist folder

4. **Configure Ollama**
- Ensure Ollama is running
- Verify llama3.2-vision model is available
- Check localhost:11434 access

## Usage

### Basic Commands
- `go to [url]` - Navigate to website
- `click [element]` - Click on element
- `search [term]` - Search on page
- `test vision` - Analyze current page

### Vision Features
- Element detection
- Layout analysis
- Interactive elements
- Visual hierarchy

## Development

### Build Commands
```bash
# Development
npm run dev

# Production
npm run build
```

### Project Structure
```
project/
├── manifest.json        # Extension configuration
├── background.js       # Background service worker
├── popup.html         # Extension UI template
├── popup.js          # UI logic and interactions
├── content.js       # Webpage interaction script
├── browser_manager.js # Browser control service
├── vision_service.js  # Vision model integration
├── command_processor.js # Command execution engine
├── commands.js        # Basic commands
├── smart_commands.js  # AI commands
├── vision_commands.js # Vision commands
└── docs/             # Project documentation
    ├── README.md
    ├── IMPLEMENTATION.md
    ├── TROUBLESHOOTING.md
    ├── CHANGELOG.md
    ├── PROJECT_STRUCTURE.md
    └── PROJECT_KNOWLEDGE.md
```

## Troubleshooting

1. Check Ollama service status
2. Verify model availability
3. Check browser console
4. Review error logs

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request
4. Follow code standards

## License

[Add License]

## UI Testing

### Prerequisites
- Node.js installed
- Chrome/Brave browser installed
- Extension loaded in browser
- Remote debugging enabled

### Setup
1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build
```

3. Load the extension in Chrome/Brave:
- Navigate to chrome://extensions
- Enable Developer mode
- Click "Load unpacked"
- Select the `dist` directory

4. Enable remote debugging:
- Launch Chrome/Brave with remote debugging enabled on port 9222
- Ensure the extension is loaded and active

5. Run the tests:
```bash
npm run test:ui
```

### Test Scenarios
The test runner includes several predefined scenarios:
- Basic navigation
- Vision testing
- Complex interactions
- Screenshot analysis

### Debugging
- Check browser console for extension logs
- Review error screenshots in test output
- Check TROUBLESHOOTING.md for common issues
- Monitor network requests in DevTools