// State management for testing session
let testingSession = { steps: [] };

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);

    if (message.type === 'STORE_SESSION') {
        testingSession = message.data;
        
        // Notify all popup instances of the update
        chrome.runtime.sendMessage({
            type: 'SESSION_UPDATED',
            session: testingSession
        });
        
        sendResponse({ success: true });
    } 
    else if (message.type === 'GET_SESSION') {
        sendResponse({ session: testingSession });
    }
    
    // Required for async response
    return true;
});

// Handle tab updates for screenshot capture
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // Notify popup that navigation is complete
        chrome.runtime.sendMessage({
            type: 'NAVIGATION_COMPLETE',
            url: tab.url
        });
    }
});