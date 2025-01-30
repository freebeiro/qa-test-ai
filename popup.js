import config from './config.js';
import CommandProcessor from './command_processor.js';

// Global state
let isProcessing = false;
let isNavigating = false;
let port = null;

document.addEventListener('DOMContentLoaded', async function() {
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const sendButton = document.getElementById('sendButton');

    // Initialize command processor
    const commandProcessor = new CommandProcessor(config);
    console.log('🔄 Extension loaded:', config);

    // Connect to background
    try {
        port = chrome.runtime.connect({name: "popup-port"});
        console.log('Connected to background');
        
        // Handle messages from background
        port.onMessage.addListener((msg) => {
            console.log('Background message:', msg);
            if (msg.type === 'TAB_UPDATED' && msg.status === 'complete') {
                setTimeout(async () => {
                    await captureAndShowScreenshot();
                    enableUI();
                }, 1000);
            }
        });

        // Set up active tab
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab) {
            chrome.runtime.sendMessage({ 
                type: 'SET_ACTIVE_TAB',
                tabId: tab.id
            });
            console.log('✅ Connected to background script, tab:', tab.id);
        }
    } catch (error) {
        console.warn('⚠️ Background script error:', error);
    }

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

    async function captureAndShowScreenshot() {
        console.log('📸 Capturing screenshot...');
        try {
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
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

    async function handleNavigation(url, tab) {
        url = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            addToChat(`Navigating to ${url}...`, 'assistant');
            isNavigating = true;

            console.log('🌐 Starting navigation:', url);
            await chrome.tabs.update(tab.id, { url });

            // Background script will trigger screenshot after navigation

        } catch (error) {
            console.error('❌ Navigation failed:', error);
            addToChat(`Navigation failed: ${error.message}`, 'error');
            enableUI();
        }
    }

    async function handleSearch(searchQuery, tab) {
        try {
            const searchResult = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
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
            await handleNavigation(`google.com/search?q=${encodeURIComponent(searchQuery)}`, tab);

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

            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tab) throw new Error('No active tab found');

            // Navigation command
            const navMatch = userInput.match(/^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i);
            if (navMatch) {
                await handleNavigation(navMatch[1], tab);
                return;
            }

            // Search command
            const searchMatch = userInput.match(/^search\s+for\s+['"]?([^'"]+)['"]?/i);
            if (searchMatch) {
                await handleSearch(searchMatch[1], tab);
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

    addToChat('Ready! Try commands like "go to google.com" or "search for \'something\'"', 'assistant');
});