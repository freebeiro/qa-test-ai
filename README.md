# QA Testing Assistant

Chrome extension for automated testing with mouse control and navigation capabilities.

## Features

### Mouse Control
- Visual cursor representation
- Coordinate-based movement
- Smooth transitions
- Persistence across navigation

### Navigation
- URL navigation with cursor persistence
- Browser back/forward
- Page refresh
- Internal URL protection

### Command System
```
# Mouse Commands
move mouse to coordinates X Y    # Move cursor to specific pixel coordinates

# Navigation Commands
go to [url]                     # Navigate to specified URL
back                            # Go back one page
forward                         # Go forward one page
refresh                         # Refresh current page
```

## Requirements

- Chrome/Brave browser
- Node.js 14+

## Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Build Extension**
```bash
npm run build
```

3. **Load in Chrome/Brave**
- Open chrome://extensions/
- Enable Developer mode
- Load unpacked -> select dist folder

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
└── docs/             # Project documentation
    ├── README.md
    ├── IMPLEMENTATION.md
    ├── TROUBLESHOOTING.md
    └── CHANGELOG.md
```

## Usage

1. Click extension icon to activate
2. Enter commands in the popup window
3. Watch cursor move and execute commands
4. Close popup to deactivate control

## Troubleshooting

1. **Cursor not visible**
   - Reload extension
   - Check console for errors
   - Verify page is not internal URL

2. **Movement not working**
   - Ensure coordinates are valid
   - Check console for errors
   - Verify tab is controlled

3. **Navigation issues**
   - Check URL format
   - Verify network connection
   - Check console for errors

## Contributing

1. Fork repository
2. Create feature branch
3. Submit pull request
4. Follow code standards

## License

[Add License]