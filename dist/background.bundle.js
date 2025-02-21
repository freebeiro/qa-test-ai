/******/ (() => { // webpackBootstrap
// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OLLAMA_REQUEST') {
    fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data)
    }).then(response => response.json()).then(data => sendResponse({
      success: true,
      data
    })).catch(error => sendResponse({
      success: false,
      error: error.message
    }));
    return true; // Keep the message channel open for async response
  }
  if (request.type === 'EXECUTE_COMMAND') {
    executeCommand(request.command).then(screenshot => {
      sendResponse({
        success: true,
        screenshot
      });
    }).catch(error => {
      sendResponse({
        success: false,
        error: error.message
      });
    });
    return true; // Keep the message channel open for async response
  }
});

// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

// Track controlled tabs
const controlledTabs = new Set();

// Clean up function for when window is closed
async function cleanup() {
  if (browserTabId) {
    await deactivateTab(browserTabId);
  }
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

// Function to inject cursor script
async function injectCursor(tabId) {
  try {
    // First check if we can inject into this tab
    const tab = await chrome.tabs.get(tabId);

    // Skip chrome:// and other internal URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('brave://')) {
      console.log('Skipping cursor injection for internal URL:', tab.url);
      return;
    }
    console.log('Injecting cursor script into tab:', tabId);

    // First inject the cursor CSS
    await chrome.scripting.insertCSS({
      target: {
        tabId
      },
      css: `
                #qa-mouse-cursor {
                    position: fixed !important;
                    width: 50px !important;
                    height: 50px !important;
                    background-color: red !important;
                    border: 3px solid black !important;
                    border-radius: 50% !important;
                    pointer-events: none !important;
                    z-index: 2147483647 !important;
                    transform: translate(-50%, -50%) !important;
                    transition: all 0.3s ease !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `
    });

    // Then inject the cursor creation script
    await chrome.scripting.executeScript({
      target: {
        tabId
      },
      func: () => {
        console.log('Creating cursor element...');

        // Remove existing cursor if any
        const existing = document.getElementById('qa-mouse-cursor');
        if (existing) existing.remove();

        // Create new cursor
        const cursor = document.createElement('div');
        cursor.id = 'qa-mouse-cursor';
        cursor.style.left = '50%';
        cursor.style.top = '50%';

        // Make sure cursor is visible
        cursor.style.display = 'block';
        cursor.style.visibility = 'visible';
        cursor.style.opacity = '1';

        // Add cursor to page
        document.body.appendChild(cursor);

        // Log creation
        console.log('Cursor created:', {
          exists: !!document.getElementById('qa-mouse-cursor'),
          style: window.getComputedStyle(cursor)
        });

        // Keep cursor visible and in front
        const ensureCursor = () => {
          const existingCursor = document.getElementById('qa-mouse-cursor');
          if (!existingCursor) {
            document.body.appendChild(cursor.cloneNode(true));
          } else {
            // Make sure cursor is visible and in front
            existingCursor.style.display = 'block';
            existingCursor.style.visibility = 'visible';
            existingCursor.style.opacity = '1';
            existingCursor.style.zIndex = '2147483647';
          }
        };

        // Check cursor every 500ms
        setInterval(ensureCursor, 500);

        // Also ensure cursor after any dynamic content changes
        const observer = new MutationObserver(ensureCursor);
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    });
    console.log('Cursor script injection complete');
  } catch (error) {
    console.error('Failed to inject cursor:', error);
    throw error;
  }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // If this is a controlled tab
    if (controlledTabs.has(tabId)) {
      var _tab$url, _tab$url2, _tab$url3;
      console.log('Controlled tab updated:', tabId);

      // Skip for internal URLs
      if ((_tab$url = tab.url) !== null && _tab$url !== void 0 && _tab$url.startsWith('chrome://') || (_tab$url2 = tab.url) !== null && _tab$url2 !== void 0 && _tab$url2.startsWith('chrome-extension://') || (_tab$url3 = tab.url) !== null && _tab$url3 !== void 0 && _tab$url3.startsWith('brave://')) {
        console.log('Removing control for internal URL:', tab.url);
        controlledTabs.delete(tabId);
        return;
      }

      // Reactivate control
      try {
        // Only inject cursor if this is the active browser tab
        if (tabId === browserTabId) {
          console.log('Reinjecting cursor in active browser tab:', tabId);
          await injectCursor(tabId);
        }

        // Wait a bit before sending activation message
        await new Promise(resolve => setTimeout(resolve, 500));
        await chrome.tabs.sendMessage(tabId, {
          type: 'ACTIVATE_CONTROL'
        });

        // Capture screenshot if port is active
        if (activePort) {
          try {
            const screenshot = await captureScreenshot();
            if (screenshot) {
              activePort.postMessage({
                type: 'PAGE_SCREENSHOT',
                screenshot: screenshot
              });
            }
          } catch (error) {
            console.log('Screenshot capture failed:', error);
          }
        }
      } catch (error) {
        console.error('Failed to reactivate tab control:', error);
        controlledTabs.delete(tabId);
      }
    }
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener(tabId => {
  if (controlledTabs.has(tabId)) {
    console.log('Removing control for closed tab:', tabId);
    controlledTabs.delete(tabId);
  }
});
chrome.action.onClicked.addListener(async tab => {
  try {
    var _qaWindow, _qaWindow2;
    // Validate and store the current tab ID
    if (!(tab !== null && tab !== void 0 && tab.id)) {
      throw new Error('Invalid tab ID');
    }

    // Deactivate previous tab if exists
    if (browserTabId && browserTabId !== tab.id) {
      await deactivateTab(browserTabId);
    }
    browserTabId = tab.id;

    // If window exists, focus it instead of creating new one
    if (qaWindow) {
      try {
        const existingWindow = await chrome.windows.get(qaWindow.id);
        if (existingWindow) {
          await chrome.windows.update(qaWindow.id, {
            focused: true
          });
          await activateTab(browserTabId);
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
    if (!((_qaWindow = qaWindow) !== null && _qaWindow !== void 0 && _qaWindow.id)) {
      throw new Error('Failed to create popup window');
    }

    // Store window info and activate tab control
    if ((_qaWindow2 = qaWindow) !== null && _qaWindow2 !== void 0 && _qaWindow2.id && browserTabId) {
      await saveState({
        qaWindowId: qaWindow.id,
        browserTabId: browserTabId
      });
      await activateTab(browserTabId);
    }
  } catch (error) {
    console.error('Failed to create window:', error);
    cleanup();
  }
});

// Handle window removal
chrome.windows.onRemoved.addListener(async windowId => {
  if (qaWindow && windowId === qaWindow.id) {
    await cleanup();
  }
});

// Handle connections from popup
chrome.runtime.onConnect.addListener(function (port) {
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
    // Special handling for ensure_cursor command
    if (command.type === 'ensure_cursor') {
      if (browserTabId) {
        await injectCursor(browserTabId);
        return null; // No screenshot needed
      }
      return null;
    }

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
          'Content-Type': 'application/json'
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
async function activateTab(tabId) {
  try {
    var _tab$url4, _tab$url5, _tab$url6;
    // Skip if already controlled
    if (controlledTabs.has(tabId)) {
      console.log('Tab already controlled:', tabId);
      return;
    }

    // Get tab info
    const tab = await chrome.tabs.get(tabId);

    // Skip internal URLs
    if ((_tab$url4 = tab.url) !== null && _tab$url4 !== void 0 && _tab$url4.startsWith('chrome://') || (_tab$url5 = tab.url) !== null && _tab$url5 !== void 0 && _tab$url5.startsWith('chrome-extension://') || (_tab$url6 = tab.url) !== null && _tab$url6 !== void 0 && _tab$url6.startsWith('brave://')) {
      console.log('Skipping control for internal URL:', tab.url);
      return;
    }
    console.log('Activating control for tab:', tabId);

    // Only inject cursor if this is the active browser tab
    if (tabId === browserTabId) {
      console.log('Injecting cursor in active browser tab:', tabId);
      await injectCursor(tabId);
    }

    // Add to controlled set and send activation message
    controlledTabs.add(tabId);
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_CONTROL'
      });
      console.log('Tab control activated:', tabId);
    } catch (error) {
      console.error('Failed to activate tab:', error);
      controlledTabs.delete(tabId);
      throw error;
    }
  } catch (error) {
    console.error('Failed to activate tab control:', error);
    controlledTabs.delete(tabId);
    throw error;
  }
}
async function deactivateTab(tabId) {
  if (!controlledTabs.has(tabId)) {
    console.log('Tab not controlled:', tabId);
    return;
  }
  console.log('Deactivating control for tab:', tabId);
  try {
    // Remove cursor if this was the active browser tab
    if (tabId === browserTabId) {
      console.log('Removing cursor from browser tab:', tabId);
      await chrome.scripting.executeScript({
        target: {
          tabId
        },
        func: () => {
          const cursor = document.getElementById('qa-mouse-cursor');
          if (cursor) cursor.remove();
          const styles = document.getElementById('qa-cursor-styles');
          if (styles) styles.remove();
        }
      });
    }
    await chrome.tabs.sendMessage(tabId, {
      type: 'DEACTIVATE_CONTROL'
    });
    console.log('Tab control deactivated:', tabId);
  } catch (error) {
    console.error('Failed to deactivate tab:', error);
  } finally {
    // Always remove from controlled set
    controlledTabs.delete(tabId);
  }
}
/******/ })()
;
//# sourceMappingURL=background.bundle.js.map