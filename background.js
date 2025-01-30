// State tracking
let browserTabId = null;  // The tab we're controlling
let qaWindow = null;      // Our chat window
let activePort = null;    // Connection to chat window

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    console.log('Target browser tab:', browserTabId);

    if (qaWindow) {
        chrome.windows.update(qaWindow.id, {
            focused: true,
            drawAttention: true
        });
        return;
    }

    const window = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 450,
        height: 600,
        left: 50,
        top: 50
    });
    
    qaWindow = window;

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

        port.postMessage({
            type: 'INIT_STATE',
            browserTabId: browserTabId
        });

        port.onDisconnect.addListener(() => {
            console.log('QA Window disconnected');
            activePort = null;
        });
    }
});

// Track tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});