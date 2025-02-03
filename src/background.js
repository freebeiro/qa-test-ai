// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;
let isInitialized = false;

// Initialize extension
function initializeExtension() {
    if (isInitialized) return;
    console.log('[INFO] Initializing QA Testing Assistant');
    
    // Handle connections
    chrome.runtime.onConnect.addListener((port) => {
        console.log('[INFO] Connection established with', port.name);
        
        if (port.name === "qa-window") {
            activePort = port;
            
            port.onDisconnect.addListener(() => {
                console.log('[INFO] Port disconnected');
                activePort = null;
                qaWindow = null;
            });

            port.onMessage.addListener(async (msg) => {
                console.log('[INFO] Received message:', msg);
                if (msg.type === 'EXECUTE_COMMAND') {
                    await executeCommand(msg.command, port);
                } else if (msg.type === 'GET_TAB_ID') {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]?.id) {
                            browserTabId = tabs[0].id;
                            port.postMessage({
                                type: 'INIT_STATE',
                                browserTabId: browserTabId
                            });
                        }
                    });
                }
            });
        }
    });

    isInitialized = true;
}

// Initialize immediately
initializeExtension();

// Handle clicks on extension icon
chrome.action.onClicked.addListener(async (tab) => {
    browserTabId = tab.id;
    console.log('[INFO] Set browserTabId:', browserTabId);
    
    // If window exists, focus it
    if (qaWindow) {
        try {
            await chrome.windows.update(qaWindow.id, { focused: true });
            return;
        } catch (error) {
            console.log('[INFO] Previous window not found, creating new one');
            qaWindow = null;
        }
    }
    
    // Create a floating window
    if (!qaWindow) {
        const screen = await chrome.system.display.getInfo();
        const display = screen[0].workArea;
        
        qaWindow = await chrome.windows.create({
            url: 'popup.html',
            type: 'popup',
            width: 400,
            height: 600,
            left: display.width - 420,
            top: display.height - 620,
            focused: true
        });
    }
});

// Execute command in browser tab
async function executeCommand(command, port) {
    try {
        if (command.toLowerCase().includes('go to')) {
            const url = command.toLowerCase().replace('go to', '').trim();
            await chrome.tabs.update(browserTabId, { 
                url: url.startsWith('http') ? url : `https://${url}`
            });
            
            port.postMessage({
                type: 'COMMAND_RESULT',
                success: true,
                message: `Navigated to ${url}`
            });
        } else {
            port.postMessage({
                type: 'COMMAND_RESULT',
                success: false,
                error: 'Unknown command'
            });
        }
    } catch (error) {
        port.postMessage({
            type: 'COMMAND_RESULT',
            success: false,
            error: error.message
        });
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXECUTE_COMMAND') {
        handleCommand(message.command, sender.tab?.id)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ error: error.message }));
        return true; // Will respond asynchronously
    }
});

async function handleCommand(command, tabId) {
    if (!tabId) {
        throw new Error('No active tab');
    }
    
    browserTabId = tabId;

    if (command.toLowerCase().includes('go to')) {
        const url = command.toLowerCase().replace('go to', '').trim();
        await chrome.tabs.update(browserTabId, { 
            url: url.startsWith('http') ? url : `https://${url}`
        });
        return { success: true, message: `Navigated to ${url}` };
    }
    
    return { error: 'Unknown command' };
}