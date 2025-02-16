// Handle Ollama API requests
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
        // Store the current tab ID
        browserTabId = tab?.id;
        
        // If window exists, focus it instead of creating new one
        if (qaWindow) {
            try {
                await chrome.windows.update(qaWindow.id, { focused: true });
                return;
            } catch (error) {
                console.error('Failed to focus window:', error);
                cleanup();
            }
        }
        
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

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab?.url
        });
    }
});