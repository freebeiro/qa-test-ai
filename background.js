// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    
    // Get screen dimensions
    const screen = window.screen;
    const width = Math.min(600, screen.availWidth * 0.4);  // 40% of screen width, max 600px
    const height = Math.min(800, screen.availHeight * 0.8);  // 80% of screen height, max 800px
    
    qaWindow = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: width,
        height: height,
        left: screen.availWidth - width - 20,  // 20px from right edge
        top: 20  // 20px from top
    });

    chrome.windows.onRemoved.addListener((windowId) => {
        if (qaWindow && windowId === qaWindow.id) {
            qaWindow = null;
        }
    });
});

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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tabId === browserTabId && activePort) {
        activePort.postMessage({
            type: 'TAB_UPDATED',
            status: changeInfo.status,
            url: tab.url
        });
    }
});