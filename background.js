// QA Testing Assistant Background Script

// State tracking
let browserTabId = null;
let qaWindow = null;
let activePort = null;

// Track controlled tabs
const controlledTabs = new Set();

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request.type);
    
    // Always respond to PING
    if (request.type === 'PING') {
        sendResponse({ success: true, message: 'Background script is active' });
        return true;
    }
    
    // Handle command execution
    if (request.type === 'EXECUTE_COMMAND') {
        getCurrentTab().then(tab => {
            if (!tab) {
                sendResponse({ success: false, error: 'No active tab found' });
                return;
            }
            
            handleCommand(request.command, tab.id)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ 
                    success: false, 
                    error: error.message 
                }));
        }).catch(error => {
            sendResponse({ 
                success: false, 
                error: 'Tab access error: ' + error.message 
            });
        });
        
        return true;
    }
    
    // Handle tab control activation
    if (request.type === 'ACTIVATE_CONTROL') {
        const tabId = sender?.tab?.id;
        if (!tabId) {
            sendResponse({ success: false, error: 'Invalid tab ID' });
            return true;
        }
        
        activateTab(tabId)
            .then(() => sendResponse({ success: true }))
            .catch(error => sendResponse({ 
                success: false, 
                error: error.message
            }));
            
        return true;
    }
    
    // Handle ensure_cursor command
    if (request.type === 'ensure_cursor') {
        getCurrentTab().then(tab => {
            injectCursor(tab.id)
                .then(() => sendResponse({ success: true }))
                .catch(error => sendResponse({ 
                    success: false, 
                    error: error.message 
                }));
        }).catch(error => {
            sendResponse({ 
                success: false, 
                error: 'Tab access error: ' + error.message 
            });
        });
        
        return true;
    }
});

// Function to handle commands
async function handleCommand(command, tabId) {
    console.log('Handling command:', command);
    
    // Take a screenshot before action
    const beforeScreenshot = await captureScreenshot();
    
    try {
        // Handle different command types
        switch (command.type) {
            case 'click':
                return await handleClickCommand(command.text, tabId, beforeScreenshot);
                
            case 'ordinal_click':
                return await handleOrdinalClickCommand(command.position, command.elementType, tabId, beforeScreenshot);
                
            case 'navigation':
                // Check if this is a navigation to a special URL like 'back'
                if (['back', 'forward', 'refresh', 'reload'].includes(command.url.toLowerCase())) {
                    switch (command.url.toLowerCase()) {
                        case 'back':
                            return await handleBackCommand(tabId, beforeScreenshot);
                        case 'forward':
                            return await handleForwardCommand(tabId, beforeScreenshot);
                        case 'refresh':
                        case 'reload':
                            return await handleRefreshCommand(tabId, beforeScreenshot);
                    }
                }
                
                return await handleNavigationCommand(command.url, tabId, beforeScreenshot);
                
            case 'back':
                return await handleBackCommand(tabId, beforeScreenshot);
                
            case 'forward':
                return await handleForwardCommand(tabId, beforeScreenshot);
                
            case 'refresh':
                return await handleRefreshCommand(tabId, beforeScreenshot);
                
            case 'input':
                // Handle input command with field and text or just text
                if (command.field) {
                    return await handleInputCommand(command.field, command.text, tabId, beforeScreenshot);
                } else {
                    return await handleSimpleInputCommand(command.text, tabId, beforeScreenshot);
                }
                
            case 'press_enter':
                return await handlePressEnterCommand(tabId, beforeScreenshot);
                
            case 'ensure_cursor':
                await injectCursor(tabId);
                return { success: true, message: 'Cursor injected successfully' };
                
            default:
                throw new Error(`Unsupported command type: ${command.type}`);
        }
    } catch (error) {
        console.error('Command execution failed:', error);
        throw error;
    }
}

// Handle click command
async function handleClickCommand(text, tabId, beforeScreenshot) {
    console.log(`Executing click for: "${text}"`);
    
    // Execute click directly in the page
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (text) => {
            console.log(`Looking for element with text: "${text}"`);
            
            // Helper function to get all potentially interactive elements
            function getAllInteractiveElements() {
                return Array.from(document.querySelectorAll(
                    'a, button, [role="button"], input[type="submit"], input[type="button"], ' +
                    '[tabindex]:not([tabindex="-1"]), [onclick], [role="link"], [role="tab"], ' +
                    '[role="menuitem"], .clickable, [data-testid*="button"], [data-testid*="link"], ' +
                    'li, .nav-item, .menu-item, h1, h2, h3, h4, h5, h6, label, .card'
                ));
            }
            
            // Helper to get element text content considering aria-label, title, etc.
            function getElementText(element) {
                const content = element.textContent?.trim() || '';
                const ariaLabel = element.getAttribute('aria-label')?.trim() || '';
                const title = element.getAttribute('title')?.trim() || '';
                const alt = element.getAttribute('alt')?.trim() || '';
                const value = element.value || '';
                
                return [content, ariaLabel, title, alt, value].filter(Boolean).join(' ');
            }
            
            // 1. First, get all potentially interactive elements
            const elements = getAllInteractiveElements();
            console.log(`Found ${elements.length} potentially interactive elements`);
            
            // 2. Try to find elements with exact text match (case-insensitive)
            let elementToClick = null;
            
            // Try exact match
            elementToClick = elements.find(el => {
                const elText = getElementText(el).toLowerCase();
                return elText.toLowerCase() === text.toLowerCase();
            });
            
            // Try contains match if no exact match
            if (!elementToClick) {
                elementToClick = elements.find(el => {
                    const elText = getElementText(el).toLowerCase();
                    return elText.toLowerCase().includes(text.toLowerCase());
                });
            }
            
            // Try finding elements with matching inner HTML
            if (!elementToClick) {
                elementToClick = elements.find(el => {
                    return el.innerHTML.toLowerCase().includes(text.toLowerCase());
                });
            }
            
            // Try additional selectors as a last resort
            if (!elementToClick) {
                const selectors = [
                    `[aria-label*="${text}"]`,
                    `[title*="${text}"]`,
                    `[alt*="${text}"]`,
                    `[placeholder*="${text}"]`
                ];
                
                for (const selector of selectors) {
                    try {
                        const el = document.querySelector(selector);
                        if (el) {
                            elementToClick = el;
                            break;
                        }
                    } catch (e) {
                        // Invalid selector, continue
                    }
                }
            }
            
            // Look specifically for the top menu items if the text is likely to be a menu item
            if (!elementToClick && ['blog', 'as nossas marcas', 'moda', 'login', 'menu'].includes(text.toLowerCase())) {
                console.log('Looking specifically for menu items');
                
                // Look for menu items with more specific selectors
                const menuSelectors = [
                    // Generic menu items
                    'nav a', 'header a', '.main-menu a', '.navigation a', '.menu a', '.top-menu a',
                    // Menu items with text
                    'a', 'button', '[role="button"]',
                    // Specific to Worten site
                    '.worten-header a', '.worten-menu a',
                    // By href attributes
                    `a[href*="${text.toLowerCase()}"]`,
                    `a[href*="${text.toLowerCase().replace(/\s+/g, '-')}"]`,
                    `a[href*="${text.toLowerCase().replace(/\s+/g, '')}"]`,
                    // Broader but still targeted
                    'nav li', 'header li', '.main-navigation li'
                ];
                
                let potentialMenuItems = [];
                
                for (const selector of menuSelectors) {
                    try {
                        // Use document.querySelectorAll to get a list of elements
                        const menuElements = document.querySelectorAll(selector);
                        
                        if (menuElements.length > 0) {
                            console.log(`Found ${menuElements.length} potential menu items with selector: ${selector}`);
                            potentialMenuItems = [...potentialMenuItems, ...Array.from(menuElements)];
                        }
                    } catch (e) {
                        // Some selectors might not be valid, ignore errors
                    }
                }
                
                // Filter for items containing the text
                if (potentialMenuItems.length > 0) {
                    // Try to find a menu item that contains the text
                    elementToClick = potentialMenuItems.find(item => {
                        return (
                            item.textContent.toLowerCase().includes(text.toLowerCase()) ||
                            (item.getAttribute('href') && 
                             item.getAttribute('href').toLowerCase().includes(text.toLowerCase()))
                        );
                    });
                    
                    if (elementToClick) {
                        console.log('Found menu item with text:', elementToClick);
                    }
                }
            }
            
            // If element found, click it directly using multiple methods
            if (elementToClick) {
                console.log('Found element to click:', elementToClick);
                
                // Highlight element
                const originalBg = elementToClick.style.backgroundColor;
                const originalOutline = elementToClick.style.outline;
                
                elementToClick.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elementToClick.style.outline = '2px solid red';
                
                // Scroll element into view
                elementToClick.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Try multiple click methods
                try {
                    // Method 1: Direct click
                    elementToClick.click();
                    console.log('Direct click success');
                } catch (e) {
                    console.error('Direct click failed:', e);
                    
                    try {
                        // Method 2: MouseEvent
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        elementToClick.dispatchEvent(clickEvent);
                        console.log('MouseEvent click success');
                    } catch (e2) {
                        console.error('MouseEvent click failed:', e2);
                        
                        try {
                            // Method 3: Programmatic href navigation for links
                            if (elementToClick.tagName === 'A' && elementToClick.href) {
                                window.location.href = elementToClick.href;
                                console.log('Href navigation success');
                            } else {
                                throw new Error('Element is not a link with href');
                            }
                        } catch (e3) {
                            console.error('All click methods failed:', e3);
                            return false;
                        }
                    }
                }
                
                // Reset styles after a delay
                setTimeout(() => {
                    elementToClick.style.backgroundColor = originalBg;
                    elementToClick.style.outline = originalOutline;
                }, 1000);
                
                return true;
            } else {
                console.error('No element found with text:', text);
                return false;
            }
        },
        args: [text]
    });
    
    // Wait for any potential page changes
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Take another screenshot after action
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: `Clicked on "${text}"`,
        beforeScreenshot,
        afterScreenshot
    };
}

// Function to find and click element by text
function clickElementByText(searchText) {
    console.log(`Looking for element with text: "${searchText}"`);
    
    // Helper function to get all potentially interactive elements
    function getAllInteractiveElements() {
        return Array.from(document.querySelectorAll(
            'a, button, [role="button"], input[type="submit"], input[type="button"], ' +
            '[tabindex]:not([tabindex="-1"]), [onclick], [role="link"], [role="tab"], ' +
            '[role="menuitem"], .clickable, [data-testid*="button"], [data-testid*="link"], ' +
            'li, .nav-item, .menu-item, h1, h2, h3, h4, h5, h6, label, .card'
        ));
    }
    
    // Helper to get element text content considering aria-label, title, etc.
    function getElementText(element) {
        const content = element.textContent?.trim() || '';
        const ariaLabel = element.getAttribute('aria-label')?.trim() || '';
        const title = element.getAttribute('title')?.trim() || '';
        const alt = element.getAttribute('alt')?.trim() || '';
        const value = element.value || '';
        
        return [content, ariaLabel, title, alt, value].filter(Boolean).join(' ');
    }
    
    // 1. First, get all potentially interactive elements
    const elements = getAllInteractiveElements();
    console.log(`Found ${elements.length} potentially interactive elements`);
    
    // 2. Try to find elements with exact text match (case-insensitive)
    let elementToClick = null;
    
    // Try exact match
    elementToClick = elements.find(el => {
        const elText = getElementText(el).toLowerCase();
        return elText.toLowerCase() === searchText.toLowerCase();
    });
    
    // Try contains match if no exact match
    if (!elementToClick) {
        elementToClick = elements.find(el => {
            const elText = getElementText(el).toLowerCase();
            return elText.toLowerCase().includes(searchText.toLowerCase());
        });
    }
    
    // Try finding elements with matching inner HTML
    if (!elementToClick) {
        elementToClick = elements.find(el => {
            return el.innerHTML.toLowerCase().includes(searchText.toLowerCase());
        });
    }
    
    // Try additional selectors as a last resort
    if (!elementToClick) {
        const selectors = [
            `[aria-label*="${searchText}"]`,
            `[title*="${searchText}"]`,
            `[alt*="${searchText}"]`,
            `[placeholder*="${searchText}"]`
        ];
        
        for (const selector of selectors) {
            try {
                const el = document.querySelector(selector);
                if (el) {
                    elementToClick = el;
                    break;
                }
            } catch (e) {
                // Invalid selector, continue
            }
        }
    }
    
    // If element found, click it
    if (elementToClick) {
        console.log('Found element to click:', elementToClick);
        
        // Highlight element
        const originalBg = elementToClick.style.backgroundColor;
        const originalOutline = elementToClick.style.outline;
        
        elementToClick.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        elementToClick.style.outline = '2px solid red';
        
        // Scroll element into view
        elementToClick.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Wait a moment before clicking
        setTimeout(() => {
            try {
                // Click the element
                elementToClick.click();
                
                // Restore original styles
                setTimeout(() => {
                    elementToClick.style.backgroundColor = originalBg;
                    elementToClick.style.outline = originalOutline;
                }, 500);
            } catch (error) {
                console.error('Click failed:', error);
            }
        }, 500);
        
        return true;
    } else {
        console.error('No element found with text:', searchText);
        return false;
    }
}

// Handle navigation command
async function handleNavigationCommand(url, tabId, beforeScreenshot) {
    console.log(`Navigating to: ${url}`);
    
    // Process URL
    let processedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        processedUrl = 'https://' + url;
    }
    
    // Navigate to the URL
    await chrome.tabs.update(tabId, { url: processedUrl });
    
    // Wait for the page to load
    await waitForTabLoad(tabId);
    
    // Capture screenshot
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: `Navigated to ${processedUrl}`,
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle back command
async function handleBackCommand(tabId, beforeScreenshot) {
    console.log('Going back in browser history');
    
    // Go back in history
    await chrome.tabs.goBack(tabId);
    
    // Wait for navigation
    await waitForTabLoad(tabId);
    
    // Capture screenshot
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: 'Navigated back in history',
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle forward command
async function handleForwardCommand(tabId, beforeScreenshot) {
    console.log('Going forward in browser history');
    
    // Go forward in history
    await chrome.tabs.goForward(tabId);
    
    // Wait for navigation
    await waitForTabLoad(tabId);
    
    // Capture screenshot
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: 'Navigated forward in history',
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle refresh command
async function handleRefreshCommand(tabId, beforeScreenshot) {
    console.log('Refreshing page');
    
    // Refresh the page
    await chrome.tabs.reload(tabId);
    
    // Wait for navigation
    await waitForTabLoad(tabId);
    
    // Capture screenshot
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: 'Page refreshed',
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle input command with field identifier
async function handleInputCommand(field, text, tabId, beforeScreenshot) {
    console.log(`Executing input for field "${field}" with text: "${text}"`);
    
    // Execute input directly in the page
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (field, text) => {
            console.log(`Looking for input field with identifier: "${field}"`);
            
            // Helper function to get all input elements
            function getAllInputElements() {
                return Array.from(document.querySelectorAll(
                    'input:not([type="submit"]):not([type="button"]):not([type="reset"]), ' +
                    'textarea, [contenteditable="true"], ' +
                    '[role="textbox"], [role="searchbox"], [role="combobox"]'
                ));
            }
            
            // Helper to get element label or placeholder
            function getElementIdentifiers(element) {
                // Get various attributes that might identify the field
                const id = element.id || '';
                const name = element.name || '';
                const placeholder = element.getAttribute('placeholder') || '';
                const ariaLabel = element.getAttribute('aria-label') || '';
                const dataTestId = element.getAttribute('data-testid') || '';
                const className = element.className || '';
                
                // Get associated label if any
                let labelText = '';
                if (element.id) {
                    const label = document.querySelector(`label[for="${element.id}"]`);
                    if (label) {
                        labelText = label.textContent.trim();
                    }
                }
                
                // Check for parent label
                let parentLabel = '';
                let parent = element.parentElement;
                while (parent && !parentLabel) {
                    if (parent.tagName === 'LABEL') {
                        parentLabel = parent.textContent.trim();
                        break;
                    }
                    parent = parent.parentElement;
                }
                
                return {
                    id,
                    name,
                    placeholder,
                    ariaLabel,
                    dataTestId,
                    className,
                    labelText,
                    parentLabel,
                    // Combined text for easier matching
                    allText: [id, name, placeholder, ariaLabel, dataTestId, labelText, parentLabel]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase()
                };
            }
            
            // 1. Get all input elements
            const inputElements = getAllInputElements();
            console.log(`Found ${inputElements.length} input elements`);
            
            // 2. Try to find the input field by various identifiers
            let inputField = null;
            const fieldLower = field.toLowerCase();
            
            // Try to find by exact match on various attributes
            inputField = inputElements.find(el => {
                const identifiers = getElementIdentifiers(el);
                return (
                    identifiers.id.toLowerCase() === fieldLower ||
                    identifiers.name.toLowerCase() === fieldLower ||
                    identifiers.placeholder.toLowerCase() === fieldLower ||
                    identifiers.ariaLabel.toLowerCase() === fieldLower ||
                    identifiers.labelText.toLowerCase() === fieldLower ||
                    identifiers.parentLabel.toLowerCase() === fieldLower
                );
            });
            
            // If no exact match, try contains match
            if (!inputField) {
                inputField = inputElements.find(el => {
                    const identifiers = getElementIdentifiers(el);
                    return identifiers.allText.includes(fieldLower);
                });
            }
            
            // Try by CSS selector as a last resort
            if (!inputField) {
                try {
                    const el = document.querySelector(field);
                    if (el && (
                        el.tagName === 'INPUT' || 
                        el.tagName === 'TEXTAREA' || 
                        el.getAttribute('contenteditable') === 'true' ||
                        el.getAttribute('role') === 'textbox' ||
                        el.getAttribute('role') === 'searchbox' ||
                        el.getAttribute('role') === 'combobox'
                    )) {
                        inputField = el;
                    }
                } catch (e) {
                    // Invalid selector, continue
                }
            }
            
            // If input field found, enter text
            if (inputField) {
                console.log('Found input field:', inputField);
                
                // Highlight the field
                const originalBg = inputField.style.backgroundColor;
                const originalOutline = inputField.style.outline;
                
                inputField.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                inputField.style.outline = '2px solid yellow';
                
                // Scroll field into view
                inputField.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Focus the field
                inputField.focus();
                
                // Clear existing value if any
                if (inputField.tagName === 'INPUT' || inputField.tagName === 'TEXTAREA') {
                    inputField.value = '';
                } else if (inputField.getAttribute('contenteditable') === 'true') {
                    inputField.textContent = '';
                }
                
                // Enter text based on element type
                if (inputField.tagName === 'INPUT' || inputField.tagName === 'TEXTAREA') {
                    // For standard input elements
                    inputField.value = text;
                    
                    // Trigger input and change events
                    inputField.dispatchEvent(new Event('input', { bubbles: true }));
                    inputField.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (inputField.getAttribute('contenteditable') === 'true') {
                    // For contenteditable elements
                    inputField.textContent = text;
                    
                    // Trigger input event
                    inputField.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // Reset styles after a delay
                setTimeout(() => {
                    inputField.style.backgroundColor = originalBg;
                    inputField.style.outline = originalOutline;
                }, 1000);
                
                return true;
            } else {
                console.error(`No input field found with identifier: ${field}`);
                return false;
            }
        },
        args: [field, text]
    });
    
    // Wait a bit for any potential reactions
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take another screenshot after action
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: `Entered "${text}" into field "${field}"`,
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle press Enter command
async function handlePressEnterCommand(tabId, beforeScreenshot) {
    console.log('Executing press Enter command');
    
    // Execute press Enter directly in the page
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
            console.log('Pressing Enter key');
            
            // Get the active element
            const activeElement = document.activeElement;
            
            // Check if the active element is an input field
            const isInputField = (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.getAttribute('contenteditable') === 'true' ||
                activeElement.getAttribute('role') === 'textbox' ||
                activeElement.getAttribute('role') === 'searchbox' ||
                activeElement.getAttribute('role') === 'combobox'
            );
            
            if (isInputField) {
                console.log('Found active input field for Enter key:', activeElement);
                
                // Highlight the field
                const originalBg = activeElement.style.backgroundColor;
                const originalOutline = activeElement.style.outline;
                
                activeElement.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                activeElement.style.outline = '2px solid yellow';
                
                // Create and dispatch keydown event
                const keydownEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                activeElement.dispatchEvent(keydownEvent);
                
                // Create and dispatch keypress event
                const keypressEvent = new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                activeElement.dispatchEvent(keypressEvent);
                
                // Create and dispatch keyup event
                const keyupEvent = new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true,
                    cancelable: true
                });
                activeElement.dispatchEvent(keyupEvent);
                
                // If it's a form input, try to submit the form
                let form = activeElement.form;
                if (!form) {
                    // Try to find parent form
                    let parent = activeElement.parentElement;
                    while (parent && !form) {
                        if (parent.tagName === 'FORM') {
                            form = parent;
                            break;
                        }
                        parent = parent.parentElement;
                    }
                }
                
                if (form) {
                    console.log('Found form, attempting to submit');
                    try {
                        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                        form.submit();
                    } catch (e) {
                        console.error('Form submission failed:', e);
                    }
                }
                
                // Reset styles after a delay
                setTimeout(() => {
                    activeElement.style.backgroundColor = originalBg;
                    activeElement.style.outline = originalOutline;
                }, 1000);
                
                return true;
            } else {
                // If no active input field, try to find the first visible input field
                const inputElements = Array.from(document.querySelectorAll(
                    'input:not([type="submit"]):not([type="button"]):not([type="reset"]), ' +
                    'textarea, [contenteditable="true"], ' +
                    '[role="textbox"], [role="searchbox"], [role="combobox"]'
                ));
                
                // Filter for visible elements
                const visibleInputs = inputElements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return (
                        rect.width > 0 &&
                        rect.height > 0 &&
                        window.getComputedStyle(el).display !== 'none' &&
                        window.getComputedStyle(el).visibility !== 'hidden'
                    );
                });
                
                if (visibleInputs.length > 0) {
                    const firstInput = visibleInputs[0];
                    console.log('Found first visible input field for Enter key:', firstInput);
                    
                    // Highlight the field
                    const originalBg = firstInput.style.backgroundColor;
                    const originalOutline = firstInput.style.outline;
                    
                    firstInput.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                    firstInput.style.outline = '2px solid yellow';
                    
                    // Scroll field into view
                    firstInput.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    
                    // Focus the field
                    firstInput.focus();
                    
                    // Create and dispatch keydown event
                    const keydownEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    firstInput.dispatchEvent(keydownEvent);
                    
                    // Create and dispatch keypress event
                    const keypressEvent = new KeyboardEvent('keypress', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    firstInput.dispatchEvent(keypressEvent);
                    
                    // Create and dispatch keyup event
                    const keyupEvent = new KeyboardEvent('keyup', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    firstInput.dispatchEvent(keyupEvent);
                    
                    // If it's a form input, try to submit the form
                    let form = firstInput.form;
                    if (!form) {
                        // Try to find parent form
                        let parent = firstInput.parentElement;
                        while (parent && !form) {
                            if (parent.tagName === 'FORM') {
                                form = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }
                    
                    if (form) {
                        console.log('Found form, attempting to submit');
                        try {
                            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                            form.submit();
                        } catch (e) {
                            console.error('Form submission failed:', e);
                        }
                    }
                    
                    // Reset styles after a delay
                    setTimeout(() => {
                        firstInput.style.backgroundColor = originalBg;
                        firstInput.style.outline = originalOutline;
                    }, 1000);
                    
                    return true;
                } else {
                    console.error('No input field found to press Enter on');
                    
                    // As a last resort, try to dispatch Enter key to document
                    try {
                        document.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true,
                            cancelable: true
                        }));
                        
                        document.dispatchEvent(new KeyboardEvent('keypress', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true,
                            cancelable: true
                        }));
                        
                        document.dispatchEvent(new KeyboardEvent('keyup', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true,
                            cancelable: true
                        }));
                        
                        return true;
                    } catch (e) {
                        console.error('Document Enter key dispatch failed:', e);
                        return false;
                    }
                }
            }
        }
    });
    
    // Wait a bit for any potential reactions or form submissions
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take another screenshot after action
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: 'Pressed Enter key',
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle ordinal click command (click first/second/third/etc. item/result/tab/etc.)
async function handleOrdinalClickCommand(position, elementType, tabId, beforeScreenshot) {
    console.log(`Executing ordinal click for position ${position} and type "${elementType}"`);
    
    // Execute ordinal click directly in the page
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (position, elementType) => {
            console.log(`Looking for elements of type "${elementType}" at position ${position}`);
            
            // Helper function to get element text content considering aria-label, title, etc.
            function getElementText(element) {
                const content = element.textContent?.trim() || '';
                const ariaLabel = element.getAttribute('aria-label')?.trim() || '';
                const title = element.getAttribute('title')?.trim() || '';
                const alt = element.getAttribute('alt')?.trim() || '';
                const value = element.value || '';
                
                return [content, ariaLabel, title, alt, value].filter(Boolean).join(' ');
            }
            
            // Helper function to get elements by type
            function getElementsByType(type) {
                const typeLower = type.toLowerCase();
                let elements = [];
                
                // Common element types and their selectors
                const typeSelectors = {
                    // Navigation elements
                    'tab': 'a[role="tab"], [role="tab"], .tab, .nav-item, .nav-link, [data-toggle="tab"]',
                    'tabs': 'a[role="tab"], [role="tab"], .tab, .nav-item, .nav-link, [data-toggle="tab"]',
                    'menu': 'nav a, .menu a, .menu-item, [role="menuitem"], .dropdown-item',
                    'menu item': 'nav a, .menu a, .menu-item, [role="menuitem"], .dropdown-item',
                    'navigation': 'nav a, header a, .navigation a, .nav a',
                    'nav': 'nav a, header a, .navigation a, .nav a',
                    'navbar': 'nav a, header a, .navbar a, .navbar-nav a',
                    
                    // Content elements
                    'result': '.result, .search-result, .item, article, .product, .card',
                    'results': '.result, .search-result, .item, article, .product, .card',
                    'item': '.item, article, .product, .card, li',
                    'items': '.item, article, .product, .card, li',
                    'product': '.product, .item, .card, article',
                    'products': '.product, .item, .card, article',
                    'article': 'article, .article, .post, .blog-post',
                    'articles': 'article, .article, .post, .blog-post',
                    
                    // UI components
                    'button': 'button, [role="button"], .btn, input[type="button"], input[type="submit"]',
                    'buttons': 'button, [role="button"], .btn, input[type="button"], input[type="submit"]',
                    'link': 'a, [role="link"], .link',
                    'links': 'a, [role="link"], .link',
                    'image': 'img, [role="img"], .image, picture',
                    'images': 'img, [role="img"], .image, picture',
                    
                    // E-commerce elements
                    'cart': '.cart, .shopping-cart, [data-testid*="cart"]',
                    'add to cart': '.add-to-cart, [data-testid*="add-to-cart"]',
                    'checkout': '.checkout, [data-testid*="checkout"]',
                    'filter': '.filter, [data-testid*="filter"], .facet',
                    'filters': '.filter, [data-testid*="filter"], .facet',
                    
                    // Layout elements
                    'carousel': '.carousel, .slider, .slideshow',
                    'carousels': '.carousel, .slider, .slideshow',
                    'slide': '.slide, .carousel-item, .slider-item',
                    'slides': '.slide, .carousel-item, .slider-item',
                    'card': '.card, .product-card, .item-card',
                    'cards': '.card, .product-card, .item-card',
                    
                    // Location-based elements
                    'left menu': '.left-menu, .sidebar-left, .left-sidebar, .left-nav',
                    'right menu': '.right-menu, .sidebar-right, .right-sidebar, .right-nav',
                    'top menu': '.top-menu, .top-nav, header nav, .main-nav',
                    'bottom menu': '.bottom-menu, .bottom-nav, footer nav',
                    'side menu': '.side-menu, .sidebar, .side-nav',
                    'header': 'header, .header, .page-header',
                    'footer': 'footer, .footer, .page-footer',
                    'sidebar': '.sidebar, .side-menu, aside',
                    
                    // Generic fallback
                    'element': '*',
                    'elements': '*'
                };
                
                // Try to find elements using predefined selectors
                if (typeSelectors[typeLower]) {
                    elements = Array.from(document.querySelectorAll(typeSelectors[typeLower]));
                    console.log(`Found ${elements.length} elements using predefined selector for "${typeLower}"`);
                }
                
                // If no elements found or no predefined selector, try to find elements containing the type in various attributes
                if (elements.length === 0) {
                    // Try to find elements with class, id, or role containing the type
                    const attributeSelectors = [
                        `[class*="${typeLower}"]`,
                        `[id*="${typeLower}"]`,
                        `[role*="${typeLower}"]`,
                        `[data-testid*="${typeLower}"]`,
                        `[aria-label*="${typeLower}"]`
                    ];
                    
                    for (const selector of attributeSelectors) {
                        try {
                            const foundElements = document.querySelectorAll(selector);
                            if (foundElements.length > 0) {
                                elements = [...elements, ...Array.from(foundElements)];
                                console.log(`Found ${foundElements.length} elements with selector: ${selector}`);
                            }
                        } catch (e) {
                            // Invalid selector, continue
                        }
                    }
                }
                
                // Filter for visible elements
                elements = elements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return (
                        rect.width > 0 &&
                        rect.height > 0 &&
                        window.getComputedStyle(el).display !== 'none' &&
                        window.getComputedStyle(el).visibility !== 'hidden'
                    );
                });
                
                console.log(`Found ${elements.length} visible elements of type "${typeLower}"`);
                return elements;
            }
            
            // Get elements of the specified type
            const elements = getElementsByType(elementType);
            
            if (elements.length === 0) {
                console.error(`No elements found of type: ${elementType}`);
                return false;
            }
            
            // Determine which element to click based on position
            let elementToClick = null;
            
            if (position === -1) {
                // Special case for "last" position
                elementToClick = elements[elements.length - 1];
            } else if (position >= 0 && position < elements.length) {
                elementToClick = elements[position];
            } else {
                console.error(`Invalid position ${position} for elements of type ${elementType} (found ${elements.length} elements)`);
                return false;
            }
            
            // If element found, click it directly using multiple methods
            if (elementToClick) {
                console.log('Found element to click:', elementToClick);
                
                // Highlight element
                const originalBg = elementToClick.style.backgroundColor;
                const originalOutline = elementToClick.style.outline;
                
                elementToClick.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                elementToClick.style.outline = '2px solid red';
                
                // Scroll element into view
                elementToClick.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
                
                // Try multiple click methods
                try {
                    // Method 1: Direct click
                    elementToClick.click();
                    console.log('Direct click success');
                } catch (e) {
                    console.error('Direct click failed:', e);
                    
                    try {
                        // Method 2: MouseEvent
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        elementToClick.dispatchEvent(clickEvent);
                        console.log('MouseEvent click success');
                    } catch (e2) {
                        console.error('MouseEvent click failed:', e2);
                        
                        try {
                            // Method 3: Programmatic href navigation for links
                            if (elementToClick.tagName === 'A' && elementToClick.href) {
                                window.location.href = elementToClick.href;
                                console.log('Href navigation success');
                            } else {
                                throw new Error('Element is not a link with href');
                            }
                        } catch (e3) {
                            console.error('All click methods failed:', e3);
                            return false;
                        }
                    }
                }
                
                // Reset styles after a delay
                setTimeout(() => {
                    elementToClick.style.backgroundColor = originalBg;
                    elementToClick.style.outline = originalOutline;
                }, 1000);
                
                return true;
            } else {
                console.error(`No element found at position ${position} for type ${elementType}`);
                return false;
            }
        },
        args: [position, elementType]
    });
    
    // Wait for any potential page changes
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Take another screenshot after action
    const afterScreenshot = await captureScreenshot();
    
    // Get ordinal text for message
    let ordinalText = '';
    if (position === 0) {
        ordinalText = 'first';
    } else if (position === 1) {
        ordinalText = 'second';
    } else if (position === 2) {
        ordinalText = 'third';
    } else if (position === 3) {
        ordinalText = 'fourth';
    } else if (position === 4) {
        ordinalText = 'fifth';
    } else if (position === -1) {
        ordinalText = 'last';
    } else {
        ordinalText = `${position + 1}th`;
    }
    
    return { 
        success: true, 
        message: `Clicked on ${ordinalText} ${elementType}`,
        beforeScreenshot,
        afterScreenshot
    };
}

// Handle simple input command (just type text into active/focused element)
async function handleSimpleInputCommand(text, tabId, beforeScreenshot) {
    console.log(`Executing simple input with text: "${text}"`);
    
    // Execute input directly in the page
    const result = await chrome.scripting.executeScript({
        target: { tabId },
        func: (text) => {
            console.log(`Typing text: "${text}"`);
            
            // Get the active element
            const activeElement = document.activeElement;
            
            // Check if the active element is an input field
            const isInputField = (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' || 
                activeElement.getAttribute('contenteditable') === 'true' ||
                activeElement.getAttribute('role') === 'textbox' ||
                activeElement.getAttribute('role') === 'searchbox' ||
                activeElement.getAttribute('role') === 'combobox'
            );
            
            if (isInputField) {
                console.log('Found active input field:', activeElement);
                
                // Highlight the field
                const originalBg = activeElement.style.backgroundColor;
                const originalOutline = activeElement.style.outline;
                
                activeElement.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                activeElement.style.outline = '2px solid yellow';
                
                // Enter text based on element type
                if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                    // For standard input elements
                    activeElement.value = text;
                    
                    // Trigger input and change events
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                    activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                } else if (activeElement.getAttribute('contenteditable') === 'true') {
                    // For contenteditable elements
                    activeElement.textContent = text;
                    
                    // Trigger input event
                    activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                }
                
                // Reset styles after a delay
                setTimeout(() => {
                    activeElement.style.backgroundColor = originalBg;
                    activeElement.style.outline = originalOutline;
                }, 1000);
                
                return true;
            } else {
                // If no active input field, try to find the first visible input field
                const inputElements = Array.from(document.querySelectorAll(
                    'input:not([type="submit"]):not([type="button"]):not([type="reset"]), ' +
                    'textarea, [contenteditable="true"], ' +
                    '[role="textbox"], [role="searchbox"], [role="combobox"]'
                ));
                
                // Filter for visible elements
                const visibleInputs = inputElements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return (
                        rect.width > 0 &&
                        rect.height > 0 &&
                        window.getComputedStyle(el).display !== 'none' &&
                        window.getComputedStyle(el).visibility !== 'hidden'
                    );
                });
                
                if (visibleInputs.length > 0) {
                    const firstInput = visibleInputs[0];
                    console.log('Found first visible input field:', firstInput);
                    
                    // Highlight the field
                    const originalBg = firstInput.style.backgroundColor;
                    const originalOutline = firstInput.style.outline;
                    
                    firstInput.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                    firstInput.style.outline = '2px solid yellow';
                    
                    // Scroll field into view
                    firstInput.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    
                    // Focus the field
                    firstInput.focus();
                    
                    // Clear existing value if any
                    if (firstInput.tagName === 'INPUT' || firstInput.tagName === 'TEXTAREA') {
                        firstInput.value = '';
                    } else if (firstInput.getAttribute('contenteditable') === 'true') {
                        firstInput.textContent = '';
                    }
                    
                    // Enter text based on element type
                    if (firstInput.tagName === 'INPUT' || firstInput.tagName === 'TEXTAREA') {
                        // For standard input elements
                        firstInput.value = text;
                        
                        // Trigger input and change events
                        firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                        firstInput.dispatchEvent(new Event('change', { bubbles: true }));
                    } else if (firstInput.getAttribute('contenteditable') === 'true') {
                        // For contenteditable elements
                        firstInput.textContent = text;
                        
                        // Trigger input event
                        firstInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    
                    // Reset styles after a delay
                    setTimeout(() => {
                        firstInput.style.backgroundColor = originalBg;
                        firstInput.style.outline = originalOutline;
                    }, 1000);
                    
                    return true;
                } else {
                    console.error('No input field found to type into');
                    return false;
                }
            }
        },
        args: [text]
    });
    
    // Wait a bit for any potential reactions
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take another screenshot after action
    const afterScreenshot = await captureScreenshot();
    
    return { 
        success: true, 
        message: `Typed "${text}"`,
        beforeScreenshot,
        afterScreenshot
    };
}

// Capture screenshot
async function captureScreenshot() {
    try {
        return await chrome.tabs.captureVisibleTab(null, {
            format: 'png',
            quality: 100
        });
    } catch (error) {
        console.error('Screenshot capture failed:', error);
        return null;
    }
}

// Helper function to wait for tab load
function waitForTabLoad(tabId) {
    return new Promise((resolve) => {
        function listener(updatedTabId, changeInfo) {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(resolve, 500); // Wait a bit extra for rendering
            }
        }
        
        chrome.tabs.onUpdated.addListener(listener);
        
        // Set a timeout in case the load event doesn't fire
        setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
        }, 10000);
    });
}

// Function to get current tab
async function getCurrentTab() {
    if (browserTabId) {
        try {
            const tab = await chrome.tabs.get(browserTabId);
            return tab;
        } catch (error) {
            console.error('Failed to get controlled tab:', error);
        }
    }
    
    // Fallback to active tab
    try {
        const [tab] = await chrome.tabs.query({ 
            active: true, 
            lastFocusedWindow: true 
        });
        
        if (!tab) {
            throw new Error('No active tab found');
        }
        
        return tab;
    } catch (error) {
        console.error('Failed to get active tab:', error);
        throw error;
    }
}

// Check if a URL is internal (from the chrome:// scheme or other browser-specific schemes)
function isInternalUrl(url) {
    if (!url) return true;
    
    try {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol.toLowerCase();
        
        // List of internal protocols
        const internalProtocols = [
            'chrome:',
            'chrome-extension:',
            'about:',
            'brave:',
            'edge:',
            'firefox:',
            'view-source:'
        ];
        
        // Log for debugging
        console.log(`Checking URL: ${url}, Protocol: ${protocol}`);
        
        // Check if protocol is in the list of internal protocols
        const isInternal = internalProtocols.includes(protocol) || 
               url === 'about:blank' || 
               url === 'about:newtab';
               
        return isInternal;
    } catch (e) {
        console.error('Invalid URL format:', e);
        return true; // Treat invalid URLs as internal for safety
    }
}

// Function to inject cursor
async function injectCursor(tabId) {
    try {
        // First check if we can inject into this tab
        const tab = await chrome.tabs.get(tabId);
        
        // Check if we're on an internal URL
        const internal = isInternalUrl(tab.url);
        console.log(`Checking for cursor injection: URL: ${tab.url}, Is internal: ${internal}`);
        
        if (internal) {
            console.log('Skipping cursor injection for internal URL:', tab.url);
            return;
        }

        console.log('Injecting cursor script into tab:', tabId);
        
        // First inject cursor CSS
        await chrome.scripting.insertCSS({
            target: { tabId },
            css: `
                #qa-mouse-cursor {
                    position: fixed !important;
                    width: 50px !important;
                    height: 50px !important;
                    background-color: red !important;
                    border: 3px solid black !important;
                    border-radius: 50% !important;
                    pointer-events: none !important;
                    z-index: 2147483647 !important;
                    transform: translate(-50%, -50%) !important;
                    transition: all 0.3s ease !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
            `
        });

        // Then inject cursor creation script
        await chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
                console.log('Creating cursor element...');
                
                // Remove existing cursor if any
                const existing = document.getElementById('qa-mouse-cursor');
                if (existing) existing.remove();
                
                // Create new cursor
                const cursor = document.createElement('div');
                cursor.id = 'qa-mouse-cursor';
                cursor.style.left = '50%';
                cursor.style.top = '50%';
                
                // Make sure cursor is visible
                cursor.style.display = 'block';
                cursor.style.visibility = 'visible';
                cursor.style.opacity = '1';
                
                // Add cursor to page
                document.body.appendChild(cursor);
            }
        });

        console.log('Cursor script injection complete');
    } catch (error) {
        console.error('Failed to inject cursor:', error);
        throw error;
    }
}

// Function to ensure content script is injected
async function ensureContentScriptInjected(tabId) {
    try {
        // Try to ping existing content script first
        try {
            await chrome.tabs.sendMessage(tabId, { type: 'PING' });
            console.log('Content script already active');
            return true;
        } catch (e) {
            console.log('Content script not found, injecting...');
        }

        // Get tab info
        const tab = await chrome.tabs.get(tabId);
        
        // Skip injection for internal URLs
        if (isInternalUrl(tab.url)) {
            console.log('Skipping content script injection for internal URL:', tab.url);
            return false;
        } else {
            console.log('URL is external, proceeding with content script injection:', tab.url);
        }

        // Inject the content script
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.bundle.js']
        });
        console.log('Content script injection complete');
        
        // Wait a bit for the script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return true;
    } catch (error) {
        console.error('Content script injection failed:', error);
        throw error;
    }
}

// Function to activate tab control
async function activateTab(tabId) {
    try {
        // First ensure content script is present
        const injected = await ensureContentScriptInjected(tabId);
        if (!injected) {
            throw new Error('Could not inject content script');
        }

        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Then proceed with activation
        if (tabId === browserTabId) {
            await injectCursor(tabId);
        }

        controlledTabs.add(tabId);
        await chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_CONTROL' });
        console.log('Tab control activated:', tabId);
    } catch (error) {
        console.error('Failed to activate tab control:', error);
        controlledTabs.delete(tabId);
        throw error;
    }
}

// Handle tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        // If this is a controlled tab
        if (controlledTabs.has(tabId)) {
            console.log('Controlled tab updated:', tabId);
            
            // Skip for internal URLs
            if (isInternalUrl(tab.url)) {
                console.log('Removing control for internal URL:', tab.url);
                controlledTabs.delete(tabId);
                return;
            } else {
                console.log('Tab update on external URL:', tab.url);
            }
            
            // Reactivate control
            try {
                // Only inject cursor if this is the active browser tab
                if (tabId === browserTabId) {
                    await injectCursor(tabId);
                }
                
                // Wait a bit before sending activation message
                await new Promise(resolve => setTimeout(resolve, 500));
                await chrome.tabs.sendMessage(tabId, { type: 'ACTIVATE_CONTROL' });
            } catch (error) {
                console.error('Failed to reactivate tab control:', error);
                controlledTabs.delete(tabId);
            }
        }
    }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
    if (controlledTabs.has(tabId)) {
        console.log('Removing control for closed tab:', tabId);
        controlledTabs.delete(tabId);
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Validate and store the current tab ID
        if (!tab?.id) {
            throw new Error('Invalid tab ID');
        }
        
        // Deactivate previous tab if exists
        if (browserTabId && browserTabId !== tab.id) {
            if (controlledTabs.has(browserTabId)) {
                controlledTabs.delete(browserTabId);
            }
        }
        
        browserTabId = tab.id;
        
        // Create window with better dimensions
        qaWindow = await chrome.windows.create({
            url: chrome.runtime.getURL('popup.html'),
            type: 'popup',
            width: 500,
            height: 700,
            top: 20,
            left: 20,
            focused: true
        });

        // Store window info and activate tab control
        chrome.storage.local.set({ 
            qaWindowId: qaWindow.id,
            browserTabId: browserTabId
        });
        await activateTab(browserTabId);

    } catch (error) {
        console.error('Failed to create window:', error);
        browserTabId = null;
        qaWindow = null;
    }
});

// Handle window removal
chrome.windows.onRemoved.addListener(async (windowId) => {
    if (qaWindow && windowId === qaWindow.id) {
        if (browserTabId) {
            if (controlledTabs.has(browserTabId)) {
                controlledTabs.delete(browserTabId);
            }
        }
        browserTabId = null;
        qaWindow = null;
        activePort = null;
    }
});

// Handle connections from popup
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        activePort = port;
        
        // Send initial state
        chrome.storage.local.get(['browserTabId']).then(result => {
            browserTabId = result.browserTabId;
            port.postMessage({
                type: 'INIT_STATE',
                browserTabId: browserTabId
            });
        });

        // Handle port disconnection
        port.onDisconnect.addListener(() => {
            activePort = null;
        });
    }
});

console.log('QA Testing Assistant background script initialized (direct implementation)');
