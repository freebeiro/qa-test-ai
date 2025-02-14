// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    
    // Create window with better dimensions
    qaWindow = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 500,  // Slightly wider
        height: 700, // Taller to accommodate chat
        top: 20,
        left: 20
    });

    chrome.windows.onRemoved.addListener((windowId) => {
        if (qaWindow && windowId === qaWindow.id) {
            qaWindow = null;
        }
    });
});

chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        activePort = port;

        port.postMessage({
            type: 'INIT_STATE',
            browserTabId: browserTabId
        });

        port.onDisconnect.addListener(() => {
            activePort = null;
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});