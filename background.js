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

chrome.action.onClicked.addListener(async (tab) => {
    // Store the current tab ID
    browserTabId = tab.id;
    
    // If window exists, focus it instead of creating new one
    if (qaWindow) {
        try {
            await chrome.windows.update(qaWindow.id, { focused: true });
            return;
        } catch (error) {
            // Window probably doesn't exist anymore
            cleanup();
        }
    }
    
    try {
        // Create window with better dimensions
        qaWindow = await chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: 500,
            height: 700,
            top: 20,
            left: 20
        });

        // Store window info
        chrome.storage.local.set({ 
            qaWindowId: qaWindow.id,
            browserTabId: browserTabId
        });

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
        chrome.storage.local.get(['browserTabId'], function(result) {
            browserTabId = result.browserTabId;
            port.postMessage({
                type: 'INIT_STATE',
                browserTabId: browserTabId
            });
        });

        // Handle port disconnection
        port.onDisconnect.addListener(() => {
            activePort = null;
        });
    }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});