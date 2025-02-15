# QA Testing Assistant Chrome Extension

A Chrome extension that helps with QA testing by providing automated testing capabilities and visual analysis.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Google Chrome browser
- Git

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd qa-testing-assistant
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   npm run build
   ```
   This will create a `dist` folder with the built extension.

4. **Load the Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `dist` folder from the project directory

## Development

- For development with hot-reload:
  ```bash
  npm run dev
  ```

- To build for production:
  ```bash
  npm run build
  ```

## Usage

1. Click the extension icon in Chrome's toolbar
2. A popup window will appear with the QA Testing interface
3. Enter commands in the input field to control the browser:
   - Navigate to URLs: `go to example.com`
   - Search: `search for something`
   - Click elements: `click Login button`
   - And more...

## Features

- Browser automation
- Visual element analysis
- Command-based interface
- Screenshot capture
- Automated testing capabilities

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed
2. Check that you're using the correct Node.js version
3. Try removing the extension from Chrome and loading it again
4. Clear Chrome's cache and restart the browser
5. Rebuild the extension using `npm run build`

## Development Notes

- The extension uses Manifest V3
- Webpack is used for bundling
- Babel is used for transpiling
- Chrome APIs are used for browser interaction

## License

[Add your license information here]