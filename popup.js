import config from './config.js';
import CommandProcessor from './command_processor.js';

// Global state
let isProcessing = false;
let isNavigating = false;
let port = null;
let browserTabId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize UI elements
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('sendButton');

    // Style adjustments for window mode
    document.body.style.height = '100vh';
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.boxSizing = 'border-box';
    chat.style.height = 'calc(100vh - 140px)';
    chat.style.overflowY = 'auto';

    // Initialize command processor
    const commandProcessor = new CommandProcessor(config);
    console.log('🔄 Extension loaded:', config);

    async function captureAndShowScreenshot() {
        if (!browserTabId) {
            console.error('No browser tab to screenshot');
            return;
        }

        console.log('📸 Capturing screenshot of browser tab:', browserTabId);
        try {
            const tab = await chrome.tabs.get(browserTabId);
            const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: 'png',
                quality: 100
            });
            
            console.log('✅ Screenshot captured');
            const imgDiv = document.createElement('div');
            imgDiv.className = 'screenshot';
            const img = document.createElement('img');
            img.src = screenshot;
            img.style.maxWidth = '100%';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            imgDiv.appendChild(img);
            chat.appendChild(imgDiv);
            chat.scrollTop = chat.scrollHeight;
        } catch (error) {
            console.error('❌ Screenshot failed:', error);
        }
    }

    function connectToBackground() {
        try {
            port = chrome.runtime.connect({name: "qa-window"});
            console.log('Connected to background');

            port.onMessage.addListener(async (msg) => {
                console.log('Background message:', msg);
                
                switch(msg.type) {
                    case 'INIT_STATE':
                        browserTabId = msg.browserTabId;
                        console.log('Got browser tab ID:', browserTabId);
                        break;
                        
                    case 'TAB_UPDATED':
                        if (msg.status === 'complete' && isNavigating) {
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            await captureAndShowScreenshot();
                            enableUI();
                        }
                        break;
                        
                    case 'BROWSER_TAB_INFO':
                        browserTabId = msg.tabId;
                        break;
                }
            });

            port.postMessage({ type: 'GET_BROWSER_TAB' });
        } catch (error) {
            console.error('Failed to connect to background:', error);
        }
    }

    // Connect to background
    connectToBackground();

    function disableUI() {
        isProcessing = true;
        input.disabled = true;
        sendButton.disabled = true;
        sendButton.style.backgroundColor = '#cccccc';
    }

    function enableUI() {
        isProcessing = false;
        isNavigating = false;
        input.disabled = false;
        sendButton.disabled = false;
        sendButton.style.backgroundColor = '#2196f3';
    }

    function addToChat(message, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    async function handleNavigation(url) {
        if (!browserTabId) {
            addToChat('Error: No browser tab to control', 'error');
            enableUI();
            return;
        }

        url = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            addToChat(`Navigating to ${url}...`, 'assistant');
            isNavigating = true;

            console.log('🌐 Starting navigation:', url);
            await chrome.tabs.update(browserTabId, { url });

        } catch (error) {
            console.error('❌ Navigation failed:', error);
            addToChat(`Navigation failed: ${error.message}`, 'error');
            enableUI();
        }
    }

    async function handleSearch(searchQuery) {
        if (!browserTabId) {
            addToChat('Error: No browser tab to control', 'error');
            enableUI();
            return;
        }

        try {
            const searchResult = await chrome.scripting.executeScript({
                target: { tabId: browserTabId },
                function: (query) => {
                    const searchSelectors = [
                        'input[type="search"]',
                        'input[name*="search"]',
                        'input[id*="search"]',
                        'input[name="q"]',
                        'input[aria-label*="search" i]',
                        'input[placeholder*="search" i]',
                        '#twotabsearchtextbox',
                        '#gh-ac',
                        '#global-search-input',
                        '.search-input',
                        '.search-box',
                        '.searchbox'
                    ];

                    let searchInput = null;
                    for (const selector of searchSelectors) {
                        searchInput = document.querySelector(selector);
                        if (searchInput) break;
                    }

                    if (searchInput) {
                        searchInput.value = query;
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        const form = searchInput.closest('form');
                        if (form) {
                            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
                            if (submitButton) {
                                submitButton.click();
                                return { success: true, method: 'button' };
                            }
                            form.submit();
                            return { success: true, method: 'form' };
                        } else {
                            searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                                key: 'Enter',
                                code: 'Enter',
                                keyCode: 13,
                                bubbles: true
                            }));
                            return { success: true, method: 'enter' };
                        }
                    }
                    return { success: false };
                },
                args: [searchQuery]
            });

            const result = searchResult[0].result;
            
            if (result.success) {
                addToChat(`Searching for "${searchQuery}" on this website...`, 'assistant');
                isNavigating = true;  // Treat search as navigation
                return;
            }

            addToChat(`No search bar found, searching on Google instead...`, 'assistant');
            await handleNavigation(`google.com/search?q=${encodeURIComponent(searchQuery)}`);

        } catch (error) {
            console.error('❌ Search failed:', error);
            addToChat(`Search failed: ${error.message}`, 'error');
            enableUI();
        }
    }

    async function handleCommand(userInput) {
        if (!userInput.trim() || isProcessing) return;

        console.log('🎯 Processing command:', userInput);
        addToChat(userInput);

        try {
            disableUI();

            // Navigation command
            const navMatch = userInput.match(/^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i);
            if (navMatch) {
                await handleNavigation(navMatch[1]);
                return;
            }

            // Search command
            const searchMatch = userInput.match(/^search\s+for\s+['"]?([^'"]+)['"]?/i);
            if (searchMatch) {
                await handleSearch(searchMatch[1]);
                return;
            }

            enableUI();

        } catch (error) {
            console.error('❌ Command failed:', error);
            addToChat(`Error: ${error.message}`, 'error');
            enableUI();
        }
    }

    // Event Listeners
    sendButton.addEventListener('click', () => {
        const userInput = input.value.trim();
        if (userInput) {
            input.value = '';
            handleCommand(userInput);
        }
    });

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const userInput = input.value.trim();
            if (userInput) {
                e.preventDefault();
                input.value = '';
                handleCommand(userInput);
            }
        }
    });

    // Initialize with helpful message
    addToChat('Ready! Try commands like "go to google.com" or "search for \'something\'"', 'assistant');
});