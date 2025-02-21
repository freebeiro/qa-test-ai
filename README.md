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
├── commands/
│   ├── commands.js       # Basic commands
│   ├── smart_commands.js # AI commands
│   └── vision_commands.js# Vision commands
└── docs/
    ├── README.md         # Project overview
    ├── IMPLEMENTATION.md # Technical details
    ├── TROUBLESHOOTING.md# Common issues
    └── CHANGELOG.md     # Version history
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
- Brave browser installed
- Extension loaded in Brave
- Remote debugging enabled in Brave

### Setup
1. Install dependencies:
```bash
npm install
```

2. Start the debug server:
```bash
npm run debug
```

3. Launch Brave with debugging enabled:
```bash
chmod +x start-brave.sh
./start-brave.sh
```

4. Run the tests:
```bash
npm run test:ui
```

### Test Scenarios
The test runner includes several predefined scenarios:
- Basic navigation
- Vision testing
- Complex interactions

Add new scenarios in `ui_test_runner.js`:
```javascript
const scenarios = [
    {
        name: 'Your Scenario',
        commands: [
            'command 1',
            'command 2',
            // ...
        ]
    }
];
```

### Debugging
- Check the debug server output for extension logs
- Look for error screenshots in the project root
- Review browser console for additional errors
- Check TROUBLESHOOTING.md for common issues