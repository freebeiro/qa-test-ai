// Content script that runs in the context of web pages

console.log('Content script loaded');

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    
    if (request.type === 'executeScript') {
        try {
            // Execute the provided script in the page context
            const result = eval(request.script);
            sendResponse({ success: true, result });
        } catch (error) {
            console.error('Script execution failed:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep the message channel open for async response
    }
});