// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'OLLAMA_REQUEST') {
        fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request.data)
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep the message channel open for async response
    }
    
    if (request.type === 'EXECUTE_COMMAND') {
        executeCommand(request.command)
            .then(screenshot => {
                sendResponse({ success: true, screenshot });
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep the message channel open for async response
    }
});

// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

// Clean up function for when window is closed
function cleanup() {
    browserTabId = null;
    qaWindow = null;
    activePort = null;
}

// Ensure storage is available
function checkStorage() {
    return new Promise((resolve, reject) => {
        if (!chrome.storage || !chrome.storage.local) {
            reject(new Error('Storage API not available'));
            return;
        }
        resolve();
    });
}

// Save state to storage
async function saveState(data) {
    try {
        await checkStorage();
        return await chrome.storage.local.set(data);
    } catch (error) {
        console.error('Failed to save state:', error);
        throw error;
    }
}

// Load state from storage
async function loadState(keys) {
    try {
        await checkStorage();
        return await chrome.storage.local.get(keys);
    } catch (error) {
        console.error('Failed to load state:', error);
        throw error;
    }
}

chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Validate and store the current tab ID
        if (!tab?.id) {
            throw new Error('Invalid tab ID');
        }
        browserTabId = tab.id;
        
        // If window exists, focus it instead of creating new one
        if (qaWindow) {
            try {
                const existingWindow = await chrome.windows.get(qaWindow.id);
                if (existingWindow) {
                    await chrome.windows.update(qaWindow.id, { focused: true });
                    return;
                }
            } catch (error) {
                console.error('Failed to focus window:', error);
                cleanup();
            }
        }
        
        // Create window with better dimensions
        qaWindow = await chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 500,
            height: 700,
            top: 20,
            left: 20,
            focused: true
        });

        // Verify window was created properly
        if (!qaWindow?.id) {
            throw new Error('Failed to create popup window');
        }

        // Ensure window type is correct
        const createdWindow = await chrome.windows.get(qaWindow.id);
        if (createdWindow.type !== 'popup') {
            throw new Error('Created window is not of type popup');
        }

        // Store window info
        if (qaWindow?.id && browserTabId) {
            await saveState({ 
                qaWindowId: qaWindow.id,
                browserTabId: browserTabId
            });
        }

    } catch (error) {
        console.error('Failed to create window:', error);
        cleanup();
    }
});

// Handle window removal
chrome.windows.onRemoved.addListener((windowId) => {
    if (qaWindow && windowId === qaWindow.id) {
        cleanup();
    }
});

// Handle connections from popup
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        activePort = port;
        
        // Send initial state
        loadState(['browserTabId']).then(result => {
            browserTabId = result.browserTabId;
            port.postMessage({
                type: 'INIT_STATE',
                browserTabId: browserTabId
            });
        }).catch(error => {
            console.error('Failed to load state:', error);
            port.postMessage({
                type: 'INIT_STATE',
                error: error.message
            });
        });

        // Handle port disconnection
        port.onDisconnect.addListener(() => {
            activePort = null;
        });
    }
});

// Capture screenshot after page load
async function captureScreenshot() {
    if (!browserTabId) return null;
    try {
        const screenshot = await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });
        return screenshot;
    } catch (error) {
        console.error('Screenshot capture failed:', error);
        return null;
    }
}

// Handle command execution and screenshot capture
async function executeCommand(command) {
    try {
        // Wait for any page load to complete
        await new Promise(resolve => {
            const checkComplete = (tabId, changeInfo) => {
                if (tabId === browserTabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(checkComplete);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(checkComplete);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                chrome.tabs.onUpdated.removeListener(checkComplete);
                resolve();
            }, 10000);
        });

        // Capture screenshot after command execution
        const screenshot = await captureScreenshot();
        
        // Send screenshot back to UI
        if (activePort && screenshot) {
            activePort.postMessage({
                type: 'COMMAND_RESULT',
                screenshot: screenshot
            });
        }

        return screenshot;
    } catch (error) {
        console.error('Command execution failed:', error);
        throw error;
    }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab?.url
        });
        
        // If page load complete, capture screenshot
        if (changeInfo.status === 'complete') {
            captureScreenshot().then(screenshot => {
                if (screenshot && activePort) {
                    activePort.postMessage({
                        type: 'PAGE_SCREENSHOT',
                        screenshot: screenshot
                    });
                }
            });
        }
    }
});

// Logging system
class LoggingSystem {
    constructor() {
        this.debugEndpoint = 'http://localhost:3456/logs';
        this.buffer = [];
        this.isConnected = false;
        this.setupConsoleOverride();
        this.startHeartbeat();
    }

    setupConsoleOverride() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };

        // Override console methods
        ['log', 'error', 'warn', 'info'].forEach(method => {
            console[method] = (...args) => {
                // Call original console method
                originalConsole[method].apply(console, args);
                // Add to our buffer
                this.buffer.push({
                    type: method,
                    timestamp: new Date().toISOString(),
                    message: args.map(arg => {
                        try {
                            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                        } catch (e) {
                            return String(arg);
                        }
                    }).join(' '),
                    tabId: browserTabId
                });
                this.flushBuffer();
            };
        });
    }

    async flushBuffer() {
        if (this.buffer.length === 0 || !this.isConnected) return;

        try {
            await fetch(this.debugEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    logs: this.buffer
                })
            });
            this.buffer = [];
        } catch (error) {
            this.isConnected = false;
        }
    }

    async startHeartbeat() {
        try {
            const response = await fetch(this.debugEndpoint + '/heartbeat');
            this.isConnected = response.ok;
        } catch (error) {
            this.isConnected = false;
        }
        
        // Check connection every 5 seconds
        setTimeout(() => this.startHeartbeat(), 5000);
    }
}

// Initialize logging system
const logger = new LoggingSystem();
