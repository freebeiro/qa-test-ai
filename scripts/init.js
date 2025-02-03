const fs = require('fs');
const path = require('path');

const files = {
    'manifest.json': `{
  "manifest_version": 3,
  "name": "QA Testing Assistant",
  "version": "1.0",
  "description": "AI-powered QA Testing Assistant",
  "permissions": [
    "tabs",
    "activeTab",
    "scripting",
    "windows",
    "tabCapture",
    "system.display"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_title": "QA Testing Assistant"
  },
  "background": {
    "service_worker": "background.js"
  }
}`,
    'background.js': `// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;
let isInitialized = false;

// Initialize extension
function initializeExtension() {
    if (isInitialized) return;
    console.log('[INFO] Initializing QA Testing Assistant');
    
    // Handle connections first
    chrome.runtime.onConnect.addListener((port) => {
        console.log('[INFO] Connection established with', port.name);
        
        if (port.name === "qa-window") {
            activePort = port;
            
            // Send initial state immediately
            port.postMessage({
                type: 'INIT_STATE',
                browserTabId: browserTabId
            });

            port.onDisconnect.addListener(() => {
                console.log('[INFO] Port disconnected');
                activePort = null;
                qaWindow = null;
            });

            port.onMessage.addListener((msg) => {
                console.log('[INFO] Received message:', msg);
                handleMessage(msg, port);
            });
        }
    });

    isInitialized = true;
}

// Initialize immediately
initializeExtension();

// Handle clicks
chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    console.log('[INFO] Set browserTabId:', browserTabId);
    
    // If window exists, focus it
    if (qaWindow) {
        try {
            await chrome.windows.update(qaWindow.id, { focused: true });
            return;
        } catch (error) {
            console.log('[INFO] Window not found, creating new one');
            qaWindow = null;
        }
    }
    
    // Create a floating window
    const screen = await chrome.system.display.getInfo();
    const display = screen[0].workArea;
    
    qaWindow = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 400,
        height: 600,
        left: display.width - 420,
        top: display.height - 620,
        focused: true,
        state: 'normal'
    });
});`,
    'popup.html': `<!DOCTYPE html>
<html>
<head>
    <title>QA Testing Assistant</title>
    <link rel="stylesheet" href="popup.css">
</head>
<body>
    <div class="titlebar">
        <div class="window-controls">
            <button class="window-control close"></button>
            <button class="window-control minimize"></button>
            <button class="window-control maximize"></button>
        </div>
        <div class="titlebar-title">QA Testing Assistant</div>
    </div>
    <div class="chat-container" id="chatHistory"></div>
    <div class="input-container">
        <input 
            type="text" 
            id="commandInput" 
            placeholder="Type a command..."
            autocomplete="off"
            spellcheck="false"
        >
        <button id="sendButton">Send</button>
    </div>
    <script src="popup.js"></script>
</body>
</html>`
};

// Create src directory if it doesn't exist
if (!fs.existsSync('src')) {
    fs.mkdirSync('src');
}

// Create styles directory if it doesn't exist
if (!fs.existsSync('src/styles')) {
    fs.mkdirSync('src/styles', { recursive: true });
}

// Write files
Object.entries(files).forEach(([filename, content]) => {
    fs.writeFileSync(path.join('src', filename), content);
    console.log(`✅ Created ${filename}`);
});

// Write popup.css
fs.writeFileSync(path.join('src', 'styles', 'popup.css'), fs.readFileSync(path.join(__dirname, '../src/styles/popup.css'), 'utf8'));
console.log('✅ Created styles/popup.css'); 