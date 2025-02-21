// Content script that runs in the context of web pages
console.log('🚀 Content script loading...');

// Track if this tab is controlled by the extension
let isControlledTab = false;

// Listen for activation message from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ACTIVATE_CONTROL') {
        isControlledTab = true;
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === 'DEACTIVATE_CONTROL') {
        isControlledTab = false;
        const cursor = document.getElementById('qa-mouse-cursor');
        if (cursor) cursor.remove();
        sendResponse({ success: true });
        return true;
    }
    
    // Only process other messages if this is a controlled tab
    if (!isControlledTab) {
        sendResponse({ success: false, error: 'Tab not controlled' });
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
});

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
async function scrollToElement(element) {
    if (!element) return false;

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
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    return true;
}