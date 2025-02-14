// State tracking
let qaWindow = null;
let targetTab = null;
let contentScriptInjected = new Set();

// Handle extension icon click
chrome.action.onClicked.addListener(async () => {
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    targetTab = currentTab;

    if (qaWindow) {
        chrome.windows.update(qaWindow.id, { focused: true });
    } else {
        chrome.windows.create({
            url: chrome.runtime.getURL('chat.html'),
            type: 'popup',
            width: 400,
            height: 600
        }, (window) => {
            qaWindow = window;
        });
    }
});

// Track window close
chrome.windows.onRemoved.addListener((windowId) => {
    if (qaWindow && qaWindow.id === windowId) {
        qaWindow = null;
        targetTab = null;
    }
});

// Execute script in tab
async function executeScriptInTab(tabId, func, args = []) {
    try {
        console.log('Executing script in tab:', tabId, func, args);
        const result = await chrome.scripting.executeScript({
            target: { tabId },
            func: typeof func === 'string' ? eval(`(${func})`) : func,
            args: args || []
        });
        return result[0]?.result;
    } catch (error) {
        console.error('Script execution failed:', error);
        throw error;
    }
}

// Inject content script if needed
async function injectContentScriptIfNeeded(tabId) {
    if (!contentScriptInjected.has(tabId)) {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.bundle.js']
        });
        contentScriptInjected.add(tabId);
    }
}

// Handle command execution
async function handleCommand(command, tab) {
    if (!tab) {
        throw new Error('No target tab available');
    }

    try {
        // Inject content script if needed
        await injectContentScriptIfNeeded(tab.id);
        
        let result;

        switch (command.type) {
            case 'navigation':
                result = await chrome.tabs.update(tab.id, { 
                    url: formatUrl(command.url)
                });
                break;
            
            case 'back':
                result = await executeScriptInTab(tab.id, () => {
                    window.history.back();
                    return true;
                });
                break;

            case 'forward':
                result = await executeScriptInTab(tab.id, () => {
                    window.history.forward();
                    return true;
                });
                break;

            case 'refresh':
                result = await chrome.tabs.reload(tab.id);
                break;

            case 'find':
                result = await executeScriptInTab(tab.id, (searchText) => {
                    // Find element by XPath
                    const xpath = `//*[contains(text(),'${searchText}')]`;
                    const element = document.evaluate(
                        xpath,
                        document,
                        null,
                        XPathResult.FIRST_ORDERED_NODE_TYPE,
                        null
                    ).singleNodeValue;

                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return true;
                    }
                    return false;
                }, [command.text]);
                break;

            case 'click':
                result = await executeScriptInTab(tab.id, (searchText) => {
                    // Helper function to check if element is visible
                    const isVisible = (elem) => {
                        if (!elem) return false;
                        const style = window.getComputedStyle(elem);
                        return style.display !== 'none' && 
                               style.visibility !== 'hidden' && 
                               style.opacity !== '0';
                    };

                    // Helper function to get element text
                    const getElementText = (elem) => {
                        return (elem.innerText || elem.textContent || '').trim().toLowerCase();
                    };

                    // Find all clickable elements
                    const clickableElements = [...document.querySelectorAll(
                        'a, button, [role="button"], input[type="submit"], [onclick], [class*="btn"], [class*="button"]'
                    )].filter(isVisible);

                    // First try exact text match
                    let element = clickableElements.find(el => 
                        getElementText(el) === searchText.toLowerCase()
                    );

                    // If no exact match, try contains
                    if (!element) {
                        element = clickableElements.find(el => 
                            getElementText(el).includes(searchText.toLowerCase())
                        );
                    }

                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return new Promise(resolve => {
                            setTimeout(() => {
                                try {
                                    element.click();
                                } catch (e) {
                                    const event = new MouseEvent('click', {
                                        view: window,
                                        bubbles: true,
                                        cancelable: true
                                    });
                                    element.dispatchEvent(event);
                                }
                                resolve(true);
                            }, 300);
                        });
                    }
                    return false;
                }, [command.target]);
                break;

            case 'scroll':
                result = await executeScriptInTab(tab.id, (direction) => {
                    const scrollOptions = { behavior: 'smooth' };
                    switch (direction) {
                        case 'up':
                            window.scrollBy({ top: -300, ...scrollOptions });
                            break;
                        case 'down':
                            window.scrollBy({ top: 300, ...scrollOptions });
                            break;
                        case 'top':
                            window.scrollTo({ top: 0, ...scrollOptions });
                            break;
                        case 'bottom':
                            window.scrollTo({ 
                                top: document.documentElement.scrollHeight,
                                ...scrollOptions
                            });
                            break;
                    }
                    return true;
                }, [command.direction]);
                break;

            default:
                throw new Error(`Unknown command type: ${command.type}`);
        }

        return {
            success: true,
            result
        };

    } catch (error) {
        console.error('Command execution failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function formatUrl(url) {
    if (url.match(/^https?:\/\//)) {
        return url;
    }
    return `https://${url}`;
}

// Port connection handling
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        port.onMessage.addListener((message) => {
            if (message.type === 'GET_TAB_ID' && targetTab) {
                port.postMessage({
                    type: 'INIT_STATE',
                    browserTabId: targetTab.id
                });
            }
            
            if (message.type === 'EXECUTE_COMMAND' && targetTab) {
                handleCommand(message.command, targetTab)
                    .then(response => {
                        port.postMessage({
                            type: 'COMMAND_RESULT',
                            ...response
                        });
                    });
            }
        });
    }
});