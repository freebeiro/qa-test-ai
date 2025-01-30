// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    
    qaWindow = await chrome.windows.create({
        url: 'popup.html',
        type: 'popup',
        width: 450,
        height: 600
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