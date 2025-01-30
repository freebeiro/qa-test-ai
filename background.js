// State tracking
let activeTabId = null;
let connections = new Map();
let isInitialized = false;

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated');
    initialize();
});

// Initialize on startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension starting up');
    initialize();
});

async function initialize() {
    if (isInitialized) return;
    
    try {
        // Get active tab on startup
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab) {
            activeTabId = tab.id;
            console.log('Initial active tab:', activeTabId);
        }
        isInitialized = true;
    } catch (error) {
        console.error('Initialization failed:', error);
    }
}

// Handle connection from popup
chrome.runtime.onConnect.addListener((port) => {
    console.log('New connection:', port.name);

    if (port.name === 'popup-port') {
        const connectionId = Date.now();
        connections.set(connectionId, port);

        // Send initial state
        if (activeTabId) {
            port.postMessage({
                type: 'INIT_STATE',
                activeTabId: activeTabId
            });
        }

        port.onDisconnect.addListener(() => {
            console.log('Connection closed:', connectionId);
            connections.delete(connectionId);
        });
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);

    switch (message.type) {
        case 'SET_ACTIVE_TAB':
            activeTabId = message.tabId;
            console.log('Active tab set:', activeTabId);
            notifyPopups({
                type: 'TAB_ACTIVATED',
                tabId: activeTabId
            });
            sendResponse({ success: true });
            break;

        case 'NAVIGATION_START':
            console.log('Navigation started:', message.url);
            notifyPopups({
                type: 'NAV_STARTED',
                url: message.url
            });
            sendResponse({ success: true });
            break;
    }
    return true;
});

// Track tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab updated:', tabId, changeInfo.status, 'Active:', activeTabId);
    
    if (tabId === activeTabId) {
        // Notify all connected popups
        notifyPopups({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    activeTabId = activeInfo.tabId;
    console.log('Active tab changed:', activeTabId);
    
    const tab = await chrome.tabs.get(activeTabId);
    notifyPopups({
        type: 'TAB_ACTIVATED',
        tabId: activeTabId,
        url: tab.url
    });
});

// Helper to notify all connected popups
function notifyPopups(message) {
    for (let [id, port] of connections) {
        try {
            port.postMessage(message);
        } catch (error) {
            console.log('Failed to notify popup:', id, error);
            connections.delete(id);
        }
    }
}