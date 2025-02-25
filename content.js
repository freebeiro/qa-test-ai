// Add reconnection logic for content script invalidation
let reconnectionAttempts = 0;
const MAX_RECONNECTION_ATTEMPTS = 3;

// Function to handle content script reconnection
function handleExtensionContextInvalidated() {
    console.log('Extension context invalidated, attempting to reconnect...');
    
    if (reconnectionAttempts < MAX_RECONNECTION_ATTEMPTS) {
        reconnectionAttempts++;
        console.log(`Reconnection attempt ${reconnectionAttempts}/${MAX_RECONNECTION_ATTEMPTS}`);
        
        // Attempt to re-establish connection
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Reconnection failed:', chrome.runtime.lastError);
                setTimeout(handleExtensionContextInvalidated, 1000);
            } else {
                console.log('Reconnection successful');
                reconnectionAttempts = 0;
                isControlledTab = true;
                startHeartbeat();
            }
        });
    } else {
        console.error('Max reconnection attempts reached');
    }
}

// Detect extension context invalidated
window.addEventListener('error', (event) => {
    if (event.error && event.error.message && 
        event.error.message.includes('Extension context invalidated')) {
        handleExtensionContextInvalidated();
    }
});
// Content script that runs in the context of web pages
console.log('🚀 Content script loading...', {
    url: window.location.href,
    timestamp: new Date().toISOString(),
    title: document.title,
    host: window.location.host,
    protocol: window.location.protocol
});

// Log for debugging if this is running on an actual webpage
console.log('Page context validation:', {
    isActualWebPage: window.location.protocol === 'http:' || window.location.protocol === 'https:',
    documentState: document.readyState,
    bodyExists: !!document.body
});

// Track if this tab is controlled by the extension
let isControlledTab = false;

// Connection state management
let connectionRetries = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const HEARTBEAT_INTERVAL = 5000;
let heartbeatTimer = null;

// Track connection state with enhanced error handling
let connectionState = {
    isConnected: false,
    lastHeartbeat: null,
    reconnecting: false,
    lastError: null,
    retryCount: 0
};



// Function to handle connection errors
function handleConnectionError(error) {
    connectionState.lastError = error;
    connectionState.isConnected = false;
    console.error('Connection error:', error);
    if (connectionState.retryCount < MAX_RETRIES) {
        connectionState.reconnecting = true;
        setTimeout(establishConnection, RETRY_DELAY);
        connectionState.retryCount++;
    } else {
        connectionState.reconnecting = false;
        console.error('Max retry attempts reached');
    }
}

// Enhanced message listener with retry logic and heartbeat
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Content script received message:', request.type);

    if (request.type === 'PING') {
        console.log('🏓 Responding to ping');
        connectionState.lastHeartbeat = Date.now();
        sendResponse({ success: true, message: 'Content script is active' });
        return true;
    }

    if (request.type === 'HEARTBEAT') {
        connectionState.lastHeartbeat = Date.now();
        sendResponse({ success: true, timestamp: Date.now() });
        return true;
    }

    if (request.type === 'ACTIVATE_CONTROL') {
        console.log('🎮 Attempting to activate tab control');
        const tryActivate = async () => {
            try {
                await establishConnection();
                isControlledTab = true;
                connectionRetries = 0;
                connectionState.isConnected = true;
                startHeartbeat();
                sendResponse({ success: true });
            } catch (error) {
                if (connectionRetries < MAX_RETRIES) {
                    connectionRetries++;
                    console.log(`Retrying connection (${connectionRetries}/${MAX_RETRIES})...`);
                    setTimeout(tryActivate, RETRY_DELAY);
                } else {
                    console.error('Failed to establish connection after retries');
                    connectionState.isConnected = false;
                    sendResponse({ success: false, error: 'Connection failed after retries' });
                }
            }
        };
        tryActivate();
        return true;
    }
    
    if (request.type === 'DEACTIVATE_CONTROL') {
        isControlledTab = false;
        connectionState.isConnected = false;
        stopHeartbeat();
        const cursor = document.getElementById('qa-mouse-cursor');
        if (cursor) cursor.remove();
        sendResponse({ success: true });
        return true;
    }
    
    // Only process other messages if this is a controlled tab and connection is active
    if (!isControlledTab || !connectionState.isConnected) {
        sendResponse({ success: false, error: 'Tab not controlled or connection lost' });
        return true;
    }

    if (request.type === 'mouse_move_coords') {
        handleMouseMove(request, sendResponse);
        return true;
    }
    
    if (request.type === 'HIDE_MOUSE') {
        cleanupCursor();
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === 'LOCATE_ELEMENT') {
        handleElementLocation(request, sendResponse);
        return true;
    }
    
    if (request.type === 'HIDE_HIGHLIGHT') {
        highlightElement.hide();
        sendResponse({ success: true });
        return true;
    }

    if (request.type === 'click') {
        console.log('Handling click command for:', request.text);
        findAndClickElement(request.text)
            .then(() => sendResponse({ success: true }))
            .catch(error => {
                console.error('Click error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
});

// Start heartbeat mechanism
function startHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
    
    heartbeatTimer = setInterval(() => {
        if (!connectionState.isConnected) return;
        
        chrome.runtime.sendMessage({ type: 'HEARTBEAT' }, response => {
            if (chrome.runtime.lastError || !response || !response.success) {
                console.warn('❌ Heartbeat failed, connection may be lost');
                handleConnectionLoss();
            } else {
                connectionState.lastHeartbeat = Date.now();
                console.debug('💓 Heartbeat successful');
            }
        });
    }, HEARTBEAT_INTERVAL);
}

// Stop heartbeat mechanism
function stopHeartbeat() {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }
}

// Handle connection loss
function handleConnectionLoss() {
    if (connectionState.reconnecting) return;
    
    connectionState.reconnecting = true;
    connectionState.isConnected = false;
    
    const tryReconnect = async () => {
        try {
            await establishConnection();
            connectionState.isConnected = true;
            connectionState.reconnecting = false;
            console.log('🔄 Connection restored');
        } catch (error) {
            console.error('❌ Reconnection failed:', error);
            if (connectionRetries < MAX_RETRIES) {
                connectionRetries++;
                setTimeout(tryReconnect, RETRY_DELAY);
            } else {
                console.error('❌ Max reconnection attempts reached');
                stopHeartbeat();
                isControlledTab = false;
            }
        }
    };
    
    tryReconnect();
}

// Inject CSS when needed
function injectCursorStyles() {
    const style = document.createElement('style');
    style.id = 'qa-cursor-styles';
    style.textContent = `
        #qa-mouse-cursor {
            position: fixed !important;
            width: 32px !important;
            height: 32px !important;
            background: rgba(255, 64, 129, 0.7) !important;
            border: 2px solid #fff !important;
            border-radius: 50% !important;
            pointer-events: none !important;
            z-index: 2147483647 !important;
            transform: translate(-50%, -50%) !important;
            transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
            box-shadow: 0 0 0 2px rgba(255, 64, 129, 0.3),
                        0 0 8px rgba(255, 64, 129, 0.5) !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            mix-blend-mode: screen !important;
            animation: cursorPulse 2s infinite !important;
            left: 50% !important;
            top: 50% !important;
        }

        #qa-mouse-cursor::after {
            content: '' !important;
            position: absolute !important;
            width: 8px !important;
            height: 8px !important;
            background: #fff !important;
            border-radius: 50% !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.8) !important;
        }

        @keyframes cursorPulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.2); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
    `;
    
    if (!document.getElementById('qa-cursor-styles')) {
        document.head.appendChild(style);
    }
}

// Function to cleanup cursor and intervals
function cleanupCursor() {
    debugLog('Cleaning up cursor');
    removeCursor();
}

// Function to remove cursor and styles
function removeCursor() {
    const cursor = document.getElementById('qa-mouse-cursor');
    if (cursor) {
        cursor.remove();
    }
    
    const styles = document.getElementById('qa-cursor-styles');
    if (styles) {
        styles.remove();
    }
}

// Handle mouse movement
function handleMouseMove(request, sendResponse) {
    try {
        let cursor = document.getElementById('qa-mouse-cursor');
        if (!cursor) {
            sendResponse({ success: false, error: 'Cursor not found' });
            return;
        }

        const targetX = request.data.x;
        const targetY = request.data.y;
        
        cursor.style.left = `${targetX}px`;
        cursor.style.top = `${targetY}px`;
        
        // Wait for transition to complete
        setTimeout(() => {
            sendResponse({ success: true });
        }, 300);
    } catch (error) {
        console.error('Error moving cursor:', error);
        sendResponse({ success: false, error: error.message });
    }
}

// Handle element location
function handleElementLocation(request, sendResponse) {
    try {
        let element = null;
        
        if (request.data.section && request.data.itemIndex) {
            element = findElementsInSection(request.data.section, request.data.itemIndex);
        } else if (request.data.section) {
            element = findElementsInSection(request.data.section);
        } else {
            const elements = findElementByText(request.data.text, document.body, request.data.type);
            element = elements[0];
        }

        if (element) {
            scrollToElement(element).then(() => {
                highlightElement.show(element);
                sendResponse({ 
                    success: true, 
                    element: {
                        tagName: element.tagName,
                        text: element.textContent.trim(),
                        type: element.getAttribute('role') || element.tagName.toLowerCase(),
                        rect: element.getBoundingClientRect()
                    }
                });
            });
        } else {
            sendResponse({ success: false, error: 'Element not found' });
        }
        } catch (error) {
        console.error('Element location failed:', error);
            sendResponse({ success: false, error: error.message });
    }
}

// Establish connection with background script
async function establishConnection() {
    return new Promise((resolve, reject) => {
        try {
            // Reset connection state
            connectionState.retryCount = 0;
            connectionState.lastError = null;
            connectionState.reconnecting = false;

            // Create cursor element
            injectCursorStyles();
            const cursor = document.createElement('div');
            cursor.id = 'qa-mouse-cursor';
            document.body.appendChild(cursor);

            // Send a test message to background script with timeout
            const timeoutId = setTimeout(() => {
                handleConnectionError(new Error('Connection attempt timed out'));
                reject(new Error('Connection attempt timed out'));
            }, 5000);

            chrome.runtime.sendMessage({ type: 'PING' }, response => {
                clearTimeout(timeoutId);
                
                if (chrome.runtime.lastError) {
                    const error = new Error('Could not establish connection. ' + chrome.runtime.lastError.message);
                    handleConnectionError(error);
                    reject(error);
                    return;
                }

                if (response && response.success) {
                    connectionState.isConnected = true;
                    connectionState.lastHeartbeat = Date.now();
                    resolve();
                } else {
                    const error = new Error('Could not establish connection. Receiving end does not exist.');
                    handleConnectionError(error);
                    reject(error);
                }
            });
        } catch (error) {
            handleConnectionError(error);
            reject(new Error('Could not establish connection. ' + error.message));
        }
    });
}

// Debug logging
function debugLog(message, data = {}) {
    console.log(
        `%c[QA Assistant] ${message}`,
        'background: #FF4081; color: white; padding: 2px 5px; border-radius: 3px;',
        data
    );
}

// Create and manage highlight overlay
const highlightElement = (() => {
    let overlay = null;

    const create = () => {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.style.position = 'absolute';
            overlay.style.border = '2px solid #2196f3';
            overlay.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
            overlay.style.zIndex = '10000';
            overlay.style.pointerEvents = 'none';
            overlay.style.transition = 'all 0.3s ease-in-out';
            overlay.style.borderRadius = '4px';
            overlay.style.boxShadow = '0 0 0 4px rgba(33, 150, 243, 0.2)';
            document.body.appendChild(overlay);
        }
        return overlay;
    };

    const show = (element) => {
        const highlight = create();
        const rect = element.getBoundingClientRect();
        highlight.style.top = `${rect.top + window.scrollY}px`;
        highlight.style.left = `${rect.left + window.scrollX}px`;
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.display = 'block';
    };

    const hide = () => {
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    return { show, hide };
})();

// Function to find elements by text content and type
function findElementByText(text, context = document.body, type = null) {
    const elements = [];
    const walker = document.createTreeWalker(
        context,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: (node) => {
                // Check text content
                if (!node.textContent.toLowerCase().includes(text.toLowerCase())) {
                    return NodeFilter.FILTER_SKIP;
                }

                // If type is specified, check element type
                if (type) {
                    switch(type.toLowerCase()) {
                        case 'button':
                            if (!node.matches('button, [role="button"], [type="button"]')) {
                                return NodeFilter.FILTER_SKIP;
                            }
                            break;
                        case 'link':
                            if (!node.matches('a, [role="link"]')) {
                                return NodeFilter.FILTER_SKIP;
                            }
                            break;
                        case 'tab':
                            if (!node.matches('[role="tab"], .tab, [data-tab]')) {
                                return NodeFilter.FILTER_SKIP;
                            }
                            break;
                    }
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node;
    while (node = walker.nextNode()) {
        elements.push(node);
    }
    return elements;
}

// Function to find elements within a section
function findElementsInSection(sectionText, itemIndex = null) {
    // First find the section
    const sections = findElementByText(sectionText);
    if (!sections.length) return null;

    const section = sections[0];
    
    // If no itemIndex, return the section itself
    if (itemIndex === null) return section;

    // Find all clickable elements within the section
    const items = section.querySelectorAll('a, button, [role="button"], [tabindex]');
    return items[itemIndex - 1] || null;
}

// Function to scroll element into view
function scrollToElement(element) {
    return new Promise((resolve) => {
        if (!element) {
            resolve(false);
            return;
        }

        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );

        if (!isInViewport) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Wait for scroll to complete
            setTimeout(() => resolve(true), 500);
        } else {
            resolve(true);
        }
    });
}

// Function to find and click element by text with improved error handling and connection checks
function findAndClickElement(text) {
    return new Promise((resolve, reject) => {
        if (!isControlledTab) {
            reject(new Error('Tab control not established. Please ensure the extension is properly connected.'));
            return;
        }

        console.log('🔍 Finding element with text:', text);
        
        // Enhanced selector for better element detection including more interactive elements
        const elements = Array.from(document.querySelectorAll(
            'a, button, [role="button"], input[type="submit"], input[type="button"], ' +
            '[tabindex]:not([tabindex="-1"]), [onclick], [role="link"], [role="tab"], ' +
            '[role="menuitem"], .clickable, [data-testid*="button"], [data-testid*="link"]'
        ));
        
        // First try exact match (case-insensitive) with enhanced attribute checking
        let element = elements.find(el => {
            const content = (el.textContent || '').toLowerCase().trim();
            const value = (el.value || '').toLowerCase().trim();
            const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase().trim();
            const title = (el.getAttribute('title') || '').toLowerCase().trim();
            const searchText = text.toLowerCase().trim();
            
            return content === searchText || 
                   value === searchText || 
                   ariaLabel === searchText || 
                   title === searchText;
        });
        
        // If no exact match, try partial match
        if (!element) {
            element = elements.find(el => {
                const content = (el.textContent || '').toLowerCase().trim();
                const value = (el.value || '').toLowerCase().trim();
                const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase().trim();
                const searchText = text.toLowerCase().trim();
                
                return content.includes(searchText) || value.includes(searchText) || ariaLabel.includes(searchText);
            });
        }
        
        if (!element) {
            reject(new Error(`Could not find element with text: ${text}`));
            return;
        }
        
        // Ensure element is visible and clickable
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            reject(new Error('Element is not visible'));
            return;
        }
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Wait for scroll animations to complete
        setTimeout(() => {
            // Simulate hover
            element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
            
            // Wait a bit after hover
            setTimeout(() => {
                // Click the element
                element.click();
                resolve(true);
            }, 100);
        }, 500);
    });
}