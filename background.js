// This script runs in the background and manages state between popup refreshes
let activeTestSession = null;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'STORE_SESSION') {
        // Store the current test session
        activeTestSession = message.data;
        sendResponse({ success: true });
    }
    
    if (message.type === 'GET_SESSION') {
        // Return the stored session
        sendResponse({ session: activeTestSession });
    }

    // Keep the message channel open for async responses
    return true;
});

// Listen for tab updates to handle navigation
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && activeTestSession) {
        try {
            // Capture screenshot after navigation
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png',
                quality: 100
            });

            // Store the screenshot in the session
            if (activeTestSession.steps.length > 0) {
                activeTestSession.steps[activeTestSession.steps.length - 1].screenshot = screenshot;
            }

            // Notify the popup of the update if it's open
            chrome.runtime.sendMessage({
                type: 'SESSION_UPDATED',
                data: activeTestSession
            }).catch(() => {
                // Popup might be closed, which is expected
                console.log('Popup not available to receive update');
            });
        } catch (error) {
            console.error('Error handling tab update:', error);
        }
    }
});