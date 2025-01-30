// State tracking
let browserTabId = null;  // The tab we're controlling
let qaWindow = null;      // Our chat window
let activePort = null;    // Connection to chat window

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    // Store the current browser tab id
    browserTabId = tab.id;
    console.log('Target browser tab:', browserTabId);

    // Check if window already exists
    if (qaWindow) {
        // Focus existing window
        chrome.windows.update(qaWindow.id, {
            focused: true,
            drawAttention: true
        });
        return;
    }

    // Create new window
    const window = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 450,
        height: 600,
        left: 50,
        top: 50
    });
    
    qaWindow = window;

    // Track window closure
    chrome.windows.onRemoved.addListener((windowId) => {
        if (qaWindow && windowId === qaWindow.id) {
            qaWindow = null;
        }
    });
});

// Handle connections from the QA window
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        console.log('QA Window connected');
        activePort = port;

        // Send initial state
        port.postMessage({
            type: 'INIT_STATE',
            browserTabId: browserTabId
        });

        port.onDisconnect.addListener(function() {
            console.log('QA Window disconnected');
            activePort = null;
        });

        // Handle messages from QA window
        port.onMessage.addListener(function(msg) {
            if (msg.type === 'GET_BROWSER_TAB') {
                port.postMessage({
                    type: 'BROWSER_TAB_INFO',
                    tabId: browserTabId
                });
            }
        });
    }
});

// Track tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only send updates for the browser tab we're controlling
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});