// Remove the import since we'll include CommandProcessor directly
// import CommandProcessor from './command_processor.js';

class CommandProcessor {
    constructor() {
        console.log('\u{1F527} Initializing CommandProcessor');
    }

    async processCommand(userInput) {
        if (!userInput.trim()) return null;

        try {
            const command = this.parseCommand(userInput);
            return command;
        } catch (error) {
            throw new Error(`Command processing failed: ${error.message}`);
        }
    }

    parseCommand(input) {
        const commands = [
            {
                type: 'navigation',
                pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
                handler: (match) => ({ type: 'navigation', url: match[1] })
            },
            {
                type: 'search',
                pattern: /^(?:search|find|look)(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i,
                handler: (match) => ({ type: 'search', query: match[1] })
            }
        ];

        for (const command of commands) {
            const match = input.match(command.pattern);
            if (match) {
                return command.handler(match);
            }
        }

        return null;
    }
}

class QAInterface {
    constructor() {
        this.commandProcessor = new CommandProcessor();
        this.isProcessing = false;
        this.isNavigating = false;
        this.port = null;
        this.browserTabId = null;
        
        this.initializeUI();
        this.connectToBackground();
        this.setupEventListeners();
    }

    initializeUI() {
        this.elements = {
            chat: document.getElementById('chat'),
            input: document.getElementById('input'),
            sendButton: document.getElementById('sendButton')
        };
    }

    connectToBackground() {
        try {
            this.port = chrome.runtime.connect({name: "qa-window"});
            this.setupPortListeners();
        } catch (error) {
            console.error('Failed to connect to background:', error);
        }
    }

    setupPortListeners() {
        this.port.onMessage.addListener(async (msg) => {
            if (msg.type === 'TAB_UPDATED' && msg.status === 'complete' && this.isNavigating) {
                await this.handleTabUpdate();
            } else if (msg.type === 'INIT_STATE') {
                this.browserTabId = msg.browserTabId;
            }
        });
    }

    async handleCommand(userInput) {
        if (!userInput.trim() || this.isProcessing) return;

        console.log('\u{27A1} Processing command:', userInput);
        
        try {
            this.toggleUI(false);
            this.addToChat(userInput);

            const command = await this.commandProcessor.processCommand(userInput);
            if (!command) {
                console.log('\u{274C} Unknown command');
                this.addToChat('Unknown command', 'error');
                return;
            }

            console.log('\u{2713} Command parsed:', command);
            await this.executeCommand(command);
        } catch (error) {
            console.error('\u{274C} Command failed:', error);
            this.addToChat(`Error: ${error.message}`, 'error');
        } finally {
            this.toggleUI(true);
        }
    }

    toggleUI(enabled) {
        this.isProcessing = !enabled;
        this.elements.input.disabled = !enabled;
        this.elements.sendButton.disabled = !enabled;
        this.elements.sendButton.style.backgroundColor = enabled ? '#2196f3' : '#cccccc';
    }

    addToChat(message, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        this.elements.chat.appendChild(messageDiv);
        this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
    }

    async handleTabUpdate() {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.captureAndShowScreenshot();
        this.toggleUI(true);
    }

    async executeCommand(command) {
        switch (command.type) {
            case 'navigation':
                await this.handleNavigation(command.url);
                break;
            case 'search':
                await this.handleSearch(command.query);
                break;
        }
    }

    async handleNavigation(url) {
        if (!this.browserTabId) {
            console.error('❌ No browser tab to control');
            this.addToChat('Error: No browser tab to control', 'error');
            return;
        }

        url = url.startsWith('http') ? url : `https://${url}`;
        
        try {
            console.log('\u{27A1} Navigating to:', url);
            this.addToChat(`Navigating to ${url}...`, 'assistant');
            this.isNavigating = true;
            await chrome.tabs.update(this.browserTabId, { url });
        } catch (error) {
            console.error('❌ Navigation failed:', error);
            this.addToChat(`Navigation failed: ${error.message}`, 'error');
            this.toggleUI(true);
        }
    }

    async handleSearch(searchQuery) {
        if (!this.browserTabId) {
            console.error('❌ No browser tab to control');
            this.addToChat('Error: No browser tab to control', 'error');
            return;
        }

        try {
            console.log('\u{1F50D} Searching for:', searchQuery);
            this.addToChat(`Searching for "${searchQuery}"...`, 'assistant');
            this.isNavigating = true;
            await this.performSearch(searchQuery);
        } catch (error) {
            console.error('❌ Search failed:', error);
            this.addToChat(`Search failed: ${error.message}`, 'error');
            this.toggleUI(true);
        }
    }

    async performSearch(query) {
        const searchResult = await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            function: (query) => {
                // Define site-specific search selectors
                const siteSearchSelectors = {
                    'amazon': {
                        selectors: ['#twotabsearchtextbox', '#nav-search-keywords'],
                        submit: '#nav-search-submit-button'
                    },
                    'ebay': {
                        selectors: ['#gh-ac', '.gh-tb'],
                        submit: '#gh-btn'
                    },
                    // Add more site-specific selectors as needed
                };

                // Get current domain
                const domain = window.location.hostname;
                
                // Check if we have specific selectors for this site
                for (const [site, config] of Object.entries(siteSearchSelectors)) {
                    if (domain.includes(site)) {
                        // Try site-specific selectors
                        for (const selector of config.selectors) {
                            const searchInput = document.querySelector(selector);
                            if (searchInput && searchInput.offsetParent !== null) {
                                searchInput.value = query;
                                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                                
                                // Try to find and click submit button
                                if (config.submit) {
                                    const submitButton = document.querySelector(config.submit);
                                    if (submitButton) {
                                        submitButton.click();
                                        return { success: true, method: 'site-specific' };
                                    }
                                }
                            }
                        }
                    }
                }

                // Generic search selectors as fallback
                const genericSelectors = [
                    'input[type="search"]',
                    'input[name*="search"]',
                    'input[name="q"]',
                    '.search-input',
                    'input[aria-label*="search" i]',
                    'input[placeholder*="search" i]'
                ];

                for (const selector of genericSelectors) {
                    const searchInput = document.querySelector(selector);
                    if (searchInput && searchInput.offsetParent !== null) {
                        searchInput.value = query;
                        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        const form = searchInput.closest('form');
                        if (form) {
                            form.submit();
                            return { success: true, method: 'form' };
                        }
                        
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
            args: [query]
        });

        if (!searchResult[0].result.success) {
            // Only fallback to Google if we're not already on a major e-commerce site
            const tab = await chrome.tabs.get(this.browserTabId);
            const url = new URL(tab.url);
            const majorSites = ['amazon', 'ebay', 'walmart', 'target'];
            
            if (!majorSites.some(site => url.hostname.includes(site))) {
                await this.handleNavigation(`google.com/search?q=${encodeURIComponent(query)}`);
            } else {
                console.error('❌ Search failed on e-commerce site');
                this.addToChat('Could not find search box on this page', 'error');
            }
        }
    }

    async captureAndShowScreenshot() {
        if (!this.browserTabId) {
            console.error('❌ No browser tab to screenshot');
            return;
        }

        try {
            console.log('\u{1F4F7} Taking screenshot');
            const tab = await chrome.tabs.get(this.browserTabId);
            const screenshot = await chrome.tabs.captureVisibleTab(tab.windowId, {
                format: 'png',
                quality: 100
            });
            
            console.log('\u{2713} Screenshot captured');
            const imgDiv = document.createElement('div');
            imgDiv.className = 'screenshot';
            const img = document.createElement('img');
            img.src = screenshot;
            img.style.maxWidth = '100%';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            imgDiv.appendChild(img);
            this.elements.chat.appendChild(imgDiv);
            this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
        } catch (error) {
            console.error('❌ Screenshot failed:', error);
        }
    }

    setupEventListeners() {
        this.elements.sendButton.addEventListener('click', () => {
            const userInput = this.elements.input.value.trim();
            if (userInput) {
                this.elements.input.value = '';
                this.handleCommand(userInput);
            }
        });

        this.elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const userInput = this.elements.input.value.trim();
                if (userInput) {
                    e.preventDefault();
                    this.elements.input.value = '';
                    this.handleCommand(userInput);
                }
            }
        });

        // Auto-resize textarea
        this.elements.input.addEventListener('input', () => {
            const textarea = this.elements.input;
            textarea.style.height = 'auto';  // Reset height
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';  // Set new height with max limit
        });

        // Welcome message
        this.addToChat('Ready! Try commands like "go to google.com" or "search for \'something\'"', 'assistant');
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new QAInterface();
});