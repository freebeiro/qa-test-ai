// Remove the import since we'll include CommandProcessor directly
// import CommandProcessor from './command_processor.js';

class CommandProcessor {
    constructor() {
        console.log('🔧 Initializing CommandProcessor');
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
            // Simplified back/forward commands
            {
                type: 'back',
                pattern: /^back$/i,
                handler: () => ({ type: 'back' })
            },
            {
                type: 'forward',
                pattern: /^forward$/i,
                handler: () => ({ type: 'forward' })
            },
            // Google search command (should come before navigation command)
            {
                type: 'navigation',
                pattern: /^google\s+(.+)$/i,
                handler: (match) => ({ 
                    type: 'navigation', 
                    url: `https://www.google.com/search?q=${encodeURIComponent(match[1])}`,
                    skipFirstResult: true // Add flag to prevent auto-clicking first result
                })
            },

            // Regular navigation command
            {
                type: 'navigation',
                pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
                handler: (match) => ({ 
                    type: 'navigation', 
                    url: match[1].toLowerCase(),
                    skipFirstResult: false // Will click first result if needed
                })
            },
            // Find and click before find to prevent pattern overlap
            {
                type: 'findAndClick',
                pattern: /^enter\s+(?:text\s+)?(?:["']([^"']+)["']|(\S+(?:\s+\S+)*))$/i,
                handler: (match) => ({ type: 'findAndClick', text: match[1] || match[2] })
            },
            // Then find
            {
                type: 'find',
                pattern: /^find\s+(?:text\s+)?(?:["']([^"']+)["']|(\S+(?:\s+\S+)*))$/i,
                handler: (match) => ({ type: 'find', text: match[1] || match[2] })
            },
            // Search with specific pattern
            {
                type: 'search',
                pattern: /^search(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i,  // Only 'search', not 'find'
                handler: (match) => ({ type: 'search', query: match[1] })
            },
            // Other commands
            {
                type: 'click',
                pattern: /^click(?:\s+on)?\s+["']?([^"']+?)["']?$/i,
                handler: (match) => ({ type: 'click', target: match[1] })
            },
            {
                type: 'scroll',
                pattern: /^scroll\s+(up|down|top|bottom)$/i,
                handler: (match) => ({ type: 'scroll', direction: match[1] })
            },
            {
                type: 'refresh',
                pattern: /^(?:refresh|reload)$/i,
                handler: () => ({ type: 'refresh' })
            },
            // Enhanced click patterns
            {
                type: 'smartClick',
                pattern: /^(?:click|select|enter)\s+(?:on\s+)?(?:the\s+)?(\d+(?:st|nd|rd|th)|first|second|third|fourth|fifth|last|[0-9]+)\s*(?:item|element)?(?:\s+containing\s+["']([^"']+)["'])?$/i,
                handler: (match) => ({
                    type: 'smartClick',
                    index: this.parseIndex(match[1]),
                    text: match[2] || null
                })
            },
            // Simple click with text
            {
                type: 'smartClick',
                pattern: /^(?:click|select|enter)(?:\s+on)?(?:\s+item)?(?:\s+containing)?\s+["']([^"']+)["']$/i,
                handler: (match) => ({
                    type: 'smartClick',
                    index: 0, // First match by default
                    text: match[1]
                })
            },
            // Enhanced product selection commands
            {
                type: 'smartFind',
                pattern: /^enter\s+(?:the\s+)?(\d+(?:st|nd|rd|th)|first|last)?\s*(?:item|product)?\s*(?:with|containing)?\s*(?:price\s+(\d+[.,]\d+)|between\s+(\d+[.,]\d+)\s+and\s+(\d+[.,]\d+)|"([^"]+)")/i,
                handler: (match) => ({
                    type: 'smartFind',
                    options: {
                        index: this.parseIndex(match[1]),
                        price: match[2] ? parseFloat(match[2].replace(',', '.')) : null,
                        priceRange: match[3] && match[4] ? {
                            min: parseFloat(match[3].replace(',', '.')),
                            max: parseFloat(match[4].replace(',', '.'))
                        } : null,
                        text: match[5]
                    }
                })
            },
            // Site search command (before the Google search pattern)
            {
                type: 'search',
                pattern: /^search\s+(.+)$/i,
                handler: (match) => ({ 
                    type: 'search', 
                    query: match[1].replace(/['"]/g, '') // Remove quotes if present
                })
            },
        ];

        for (const command of commands) {
            const match = input.match(command.pattern);
            if (match) {
                console.log(`✅ Command matched pattern: ${command.type}`);
                return command.handler(match);
            }
        }

        throw new Error('Unknown command');
    }

    parseIndex(indexStr) {
        if (!indexStr) return 0;
        
        const numberMap = {
            'first': 0,
            'second': 1,
            'third': 2,
            'fourth': 3,
            'fifth': 4,
            'last': 'last'
        };

        // Handle written numbers
        if (indexStr.toLowerCase() in numberMap) {
            return numberMap[indexStr.toLowerCase()];
        }

        // Handle numeric indices (1-based to 0-based)
        const numericIndex = parseInt(indexStr) - 1;
        return isNaN(numericIndex) ? 0 : numericIndex;
    }

    getOrdinalSuffix(i) {
        const j = i % 10, k = i % 100;
        if (j == 1 && k != 11) return "st";
        if (j == 2 && k != 12) return "nd";
        if (j == 3 && k != 13) return "rd";
        return "th";
    }
}

// Command interface
class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }
}

// Concrete commands
class NavigationCommand extends Command {
    constructor(url, browserTab, skipFirstResult = false) {
        super();
        this.url = url;
        this.browserTab = browserTab;
        this.skipFirstResult = skipFirstResult;
        console.log(`🌐 Creating NavigationCommand for: ${this.url} (skipFirstResult: ${skipFirstResult})`);
    }

    async execute() {
        try {
            const formattedUrl = this.formatUrl(this.url);
            
            if (formattedUrl && !this.skipFirstResult) {
                console.log(`🌐 Attempting direct navigation to: ${formattedUrl}`);
                await this.browserTab.navigate(formattedUrl);

                // Wait for page load
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    // Check if page loaded successfully
                    const checkPageScript = () => {
                        const errorTexts = [
                            "This site can't be reached",
                            "DNS_PROBE_POSSIBLE",
                            "ERR_NAME_NOT_RESOLVED",
                            "ERR_CONNECTION_REFUSED",
                            "showing error page"
                        ];
                        
                        const pageText = document.body.innerText;
                        return errorTexts.some(error => pageText.includes(error));
                    };

                    const hasError = await this.browserTab.executeScript(checkPageScript);
                    
                    // If script execution failed or error detected, fall back to Google search
                    if (hasError?.[0] || !hasError) {
                        console.log('🔄 Page error detected, falling back to Google search');
                        return await this.handleGoogleSearch();
                    }

                    // Take screenshot of successful navigation
                    await this.browserTab.captureScreenshot();
                    return true;

                } catch (scriptError) {
                    console.log('🔄 Script execution failed, falling back to Google search');
                    return await this.handleGoogleSearch();
                }
            }

            // If no direct URL, do Google search
            return await this.handleGoogleSearch();

        } catch (error) {
            console.error('❌ Navigation error:', error);
            throw error;
        }
    }

    async handleGoogleSearch() {
        console.log(`🔍 Searching Google for: ${this.url}`);
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(this.url)}`;
        await this.browserTab.navigate(googleUrl);
        
        // Wait for Google results and take screenshot
        await new Promise(resolve => setTimeout(resolve, 1500));
        await this.browserTab.captureScreenshot();
        
        if (!this.skipFirstResult) {
            // Click first result
            const clickFirstResult = () => {
                const searchResults = document.querySelectorAll('#search .g a');
                if (searchResults.length > 0) {
                    const firstResult = searchResults[0];
                    console.log('🎯 Clicking first result:', firstResult.href);
                    firstResult.click();
                    return firstResult.href;
                }
                return false;
            };

            const result = await this.browserTab.executeScript(clickFirstResult);
            if (!result?.[0]) {
                throw new Error('Could not find search results');
            }

            // Wait for destination page and take screenshot
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.browserTab.captureScreenshot();
        }

        return true;
    }

    formatUrl(url) {
        // If it's already a full URL, return it
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // If it contains a dot, treat it as a domain
        if (url.includes('.')) {
            return `https://${url.startsWith('www.') ? '' : 'www.'}${url}`;
        }

        // Otherwise, return null to indicate we should search
        return null;
    }
}

// Command factory
class CommandFactory {
    static createCommand(type, params, browserTab) {
        switch(type) {
            case 'navigation':
                return new NavigationCommand(params.url, browserTab, params.skipFirstResult);
            case 'search':
                return new SearchCommand(params.query, browserTab);
            case 'back':
                return new BackCommand(browserTab);
            case 'forward':
                return new ForwardCommand(browserTab);
            case 'refresh':
                return new RefreshCommand(browserTab);
            case 'scroll':
                return new ScrollCommand(params.direction, browserTab);
            case 'find':
                return new FindCommand(params.text, browserTab);
            case 'findAndClick':
                return new FindAndClickCommand(params.text, browserTab);
            default:
                return null;
        }
    }
}

// Browser tab management
class BrowserTabManager {
    constructor() {
        this.tabId = null;
        this.port = null;
        this.initializeConnection();
        console.log('🔧 Initializing BrowserTabManager');
    }

    initializeConnection() {
        this.port = chrome.runtime.connect({ name: "qa-window" });
        
        this.port.onMessage.addListener((message) => {
            if (message.type === 'INIT_STATE') {
                this.tabId = message.browserTabId;
                console.log(`🔧 Initialized with browser tab ID: ${this.tabId}`);
            }
        });
    }

    async navigate(url) {
        if (!this.tabId) {
            throw new Error('Browser tab ID not initialized');
        }
        return await chrome.tabs.update(this.tabId, { url });
    }

    async captureScreenshot() {
        const tab = await chrome.tabs.get(this.tabId);
        return await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
    }

    async executeScript(func, args) {
        console.log(`🔧 Executing script with args:`, args);
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: this.tabId },
                function: func,
                args: args
            });
            console.log('✅ Script execution result:', result);
            return result;
        } catch (error) {
            console.error('❌ Script execution failed:', error);
            throw error;
        }
    }
}

// UI Management
class UIManager {
    constructor(elements) {
        this.elements = elements;
    }

    toggleControls(enabled) {
        this.elements.input.disabled = !enabled;
        this.elements.sendButton.disabled = !enabled;
        this.elements.sendButton.style.backgroundColor = enabled ? '#2196f3' : '#cccccc';
    }

    addMessage(message, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        this.elements.chat.appendChild(messageDiv);
        this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
    }
}

// Command Parser
class CommandParser {
    constructor() {
        this.patterns = new Map([
            ['navigation', /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i],
            ['search', /^search(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i],
            // Add other patterns...
        ]);
    }

    parse(input) {
        for (const [type, pattern] of this.patterns) {
            const match = input.match(pattern);
            if (match) {
                return { type, params: this.extractParams(type, match) };
            }
        }
        return null;
    }

    extractParams(type, match) {
        switch(type) {
            case 'navigation':
                return { url: match[1] };
            case 'search':
                return { query: match[1] };
            // Add other parameter extractions...
        }
    }
}

class QAInterface {
    constructor() {
        // Initialize components
        this.commandProcessor = new CommandProcessor();
        this.browserTab = new BrowserTabManager();
        this.chatHistory = [];
        
        // Get DOM elements
        this.input = document.querySelector('#command-input');
        this.sendButton = document.querySelector('#send-button');
        this.screenshotDiv = document.querySelector('#screenshot');
        
        if (!this.input || !this.sendButton || !this.screenshotDiv) {
            console.error('❌ Required DOM elements not found');
            return;
        }

        this.setupEventListeners();
        console.log('🔧 QAInterface initialized');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            const command = this.input.value.trim();
            if (command) {
                this.handleCommand(command);
            }
        });

        // Enter key press
        this.input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const command = this.input.value.trim();
                if (command) {
                    this.handleCommand(command);
                }
            }
        });
    }

    addToChatHistory(entry) {
        this.chatHistory.push(entry);
        this.updateChatDisplay();
    }

    updateChatDisplay() {
        this.screenshotDiv.innerHTML = '';
        
        this.chatHistory.forEach((entry, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-entry';
            
            // Add command text
            const commandDiv = document.createElement('div');
            commandDiv.className = 'command-text';
            commandDiv.textContent = `> ${entry.command}`;
            messageDiv.appendChild(commandDiv);

            // Add screenshots if any
            if (entry.screenshots && entry.screenshots.length > 0) {
                const screenshotsDiv = document.createElement('div');
                screenshotsDiv.className = 'screenshots-container';
                
                entry.screenshots.forEach((screenshot, idx) => {
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'screenshot-wrapper';
                    
                    const img = document.createElement('img');
                    img.src = screenshot.data;
                    img.alt = `Step ${idx + 1}`;
                    
                    const caption = document.createElement('div');
                    caption.className = 'screenshot-caption';
                    caption.textContent = screenshot.caption || `Step ${idx + 1}`;
                    
                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(caption);
                    screenshotsDiv.appendChild(imgWrapper);
                });
                
                messageDiv.appendChild(screenshotsDiv);
            }

            // Add any error messages
            if (entry.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = entry.error;
                messageDiv.appendChild(errorDiv);
            }

            this.screenshotDiv.appendChild(messageDiv);
        });

        // Scroll to bottom
        this.screenshotDiv.scrollTop = this.screenshotDiv.scrollHeight;
    }

    async handleCommand(command) {
        const chatEntry = {
            command,
            screenshots: [],
            timestamp: new Date().toISOString()
        };

        try {
            this.disableUI();
            
            const commandData = await this.commandProcessor.processCommand(command);
            if (!commandData) {
                throw new Error('Invalid command');
            }

            const cmd = this.createCommand(commandData);
            if (!cmd) {
                throw new Error('Command creation failed');
            }

            await cmd.execute();
            
            // Capture final screenshot
            const screenshot = await this.browserTab.captureScreenshot();
            if (screenshot) {
                chatEntry.screenshots.push({
                    data: screenshot,
                    caption: 'Result'
                });
            }

        } catch (error) {
            console.error('❌ Command execution failed:', error);
            chatEntry.error = error.message;
        } finally {
            this.addToChatHistory(chatEntry);
            this.enableUI();
            // Clear the input field after command execution
            this.input.value = '';
        }
    }

    disableUI() {
        this.input.disabled = true;
        this.sendButton.disabled = true;
    }

    enableUI() {
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.input.focus();
    }

    createCommand(commandData) {
        return CommandFactory.createCommand(
            commandData.type, 
            commandData.params || commandData, 
            this.browserTab
        );
    }
}

// Add missing command classes
class SearchCommand extends Command {
    constructor(query, browserTab) {
        super();
        this.query = query;
        this.browserTab = browserTab;
        console.log(`🔍 Creating SearchCommand for query: "${query}"`);
    }

    async execute() {
        console.log(`🔍 Executing SearchCommand for: "${this.query}"`);
        
        const searchScript = (searchQuery) => {
            console.log(`🔍 Running search script for: "${searchQuery}"`);
            
            const findSearchElements = () => {
                // Priority-based search input selectors
                const searchInputSelectors = [
                    // Priority 1: Standard search inputs
                    'input[type="search"]',
                    'input[role="search"]',
                    
                    // Priority 2: Common search patterns
                    'input[name="q"]',
                    'input[name="query"]',
                    'input[name="search"]',
                    
                    // Priority 3: Attribute-based search
                    'input[id*="search" i]',
                    'input[class*="search" i]',
                    'input[placeholder*="search" i]',
                    'input[aria-label*="search" i]',
                    
                    // Priority 4: Generic form inputs
                    'form input[type="text"]'
                ];

                // Find search input
                let searchInput = null;
                for (const selector of searchInputSelectors) {
                    const input = document.querySelector(selector);
                    if (input && input.offsetParent !== null) {
                        searchInput = input;
                        break;
                    }
                }

                // Find associated search button
                let searchButton = null;
                if (searchInput?.form) {
                    const buttonSelectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button[aria-label*="search" i]',
                        'button[title*="search" i]',
                        '[role="button"][aria-label*="search" i]'
                    ];

                    for (const selector of buttonSelectors) {
                        const button = searchInput.form.querySelector(selector);
                        if (button && button.offsetParent !== null) {
                            searchButton = button;
                            break;
                        }
                    }
                }

                return { searchInput, searchButton };
            };

            const { searchInput, searchButton } = findSearchElements();

            if (!searchInput) {
                console.log('❌ No search input found');
                return { success: false, message: 'No search input found' };
            }

            // Fill and trigger input events
            searchInput.value = searchQuery;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Try different submission methods
            if (searchButton) {
                console.log('🔍 Clicking search button');
                searchButton.click();
                return { success: true, message: 'Search button clicked' };
            }

            if (searchInput.form) {
                console.log('🔍 Submitting search form');
                searchInput.form.submit();
                return { success: true, message: 'Form submitted' };
            }

            // Last resort: simulate Enter key
            console.log('🔍 Simulating Enter key');
            searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            }));
            
            return { success: true, message: 'Enter key pressed' };
        };

        try {
            const result = await this.browserTab.executeScript(searchScript, [this.query]);
            console.log('🔍 Search result:', result?.[0]);
            
            // Wait for search results and take screenshot
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.browserTab.captureScreenshot();
            
            return result;
        } catch (error) {
            console.error('❌ Search error:', error);
            throw error;
        }
    }
}

class BackCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('⬅️ Creating BackCommand');
    }

    async execute() {
        console.log('⬅️ Executing back command');
        try {
            await chrome.tabs.goBack(this.browserTab.tabId);
            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Take screenshot of new page
            await this.browserTab.captureScreenshot();
            return true;
        } catch (error) {
            console.error('❌ Back navigation failed:', error);
            throw error;
        }
    }
}

class ForwardCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('➡️ Creating ForwardCommand');
    }

    async execute() {
        console.log('➡️ Executing forward command');
        try {
            await chrome.tabs.goForward(this.browserTab.tabId);
            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Take screenshot of new page
            await this.browserTab.captureScreenshot();
            return true;
        } catch (error) {
            console.error('❌ Forward navigation failed:', error);
            throw error;
        }
    }
}

class RefreshCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
    }

    async execute() {
        return await chrome.tabs.reload(this.browserTab.tabId);
    }
}

class ScrollCommand extends Command {
    constructor(direction, browserTab) {
        super();
        this.direction = direction;
        this.browserTab = browserTab;
        console.log(`🔄 Creating ScrollCommand with direction: ${direction}`);
    }

    async execute() {
        console.log(`🔄 Executing scroll ${this.direction}`);
        const scrollScript = function(direction) {
            console.log(`🔄 Running scroll script for direction: ${direction}`);
            const scrollAmount = 300;
            switch(direction.toLowerCase()) {
                case 'up': 
                    console.log('⬆️ Scrolling up');
                    window.scrollBy({
                        top: -scrollAmount,
                        behavior: 'smooth'
                    });
                    break;
                case 'down': 
                    console.log('⬇️ Scrolling down');
                    window.scrollBy({
                        top: scrollAmount,
                        behavior: 'smooth'
                    });
                    break;
                case 'top': 
                    console.log('⏫ Scrolling to top');
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                    break;
                case 'bottom': 
                    console.log('⏬ Scrolling to bottom');
                    window.scrollTo({
                        top: document.documentElement.scrollHeight,
                        behavior: 'smooth'
                    });
                    break;
            }
            return true;
        };

        try {
            console.log('🔄 Executing scroll script via browserTab');
            const result = await this.browserTab.executeScript(scrollScript, [this.direction]);
            console.log('✅ Scroll result:', result);
            return result;
        } catch (error) {
            console.error('❌ Scroll error:', error);
            throw error;
        }
    }
}

// Add FindCommand and FindAndClickCommand
class FindCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
    }

    async execute() {
        const findScript = (searchText) => {
            window.find(searchText);
        };
        return await this.browserTab.executeScript(findScript, [this.text]);
    }
}

class FindAndClickCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
        console.log(`🔍 Creating FindAndClickCommand for text: "${text}"`);
    }

    async execute() {
        console.log(`🔍 Executing FindAndClickCommand for: "${this.text}"`);
        const findAndClickScript = (searchText) => {
            console.log(`🔍 Running find and click script for: "${searchText}"`);
            
            // Helper function to check if element is visible and clickable
            const isVisible = (element) => {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0 &&
                       rect.top < window.innerHeight &&
                       rect.left < window.innerWidth;
            };

            // Helper function to get element text content
            const getElementText = (element) => {
                return (element.textContent || element.value || '').trim().toLowerCase();
            };

            // Helper function to simulate a more natural click
            const simulateClick = (element) => {
                // Try multiple click methods
                try {
                    // First try the click() method
                    element.click();
                    
                    // If that didn't work, try dispatching events
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    element.dispatchEvent(clickEvent);
                    
                    return true;
                } catch (error) {
                    console.error('Click simulation failed:', error);
                    return false;
                }
            };

            // First try exact matches on interactive elements
            const interactiveElements = [...document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"], [onclick], [class*="button"], [class*="btn"]')]
                .filter(el => isVisible(el) && 
                    getElementText(el) === searchText.toLowerCase());

            if (interactiveElements.length > 0) {
                console.log('✅ Found exact match:', interactiveElements[0]);
                return simulateClick(interactiveElements[0]);
            }

            // Then try contains on interactive elements
            const containsElements = [...document.querySelectorAll('button, a, input[type="submit"], input[type="button"], [role="button"], [onclick], [class*="button"], [class*="btn"]')]
                .filter(el => isVisible(el) && 
                    getElementText(el).includes(searchText.toLowerCase()));

            if (containsElements.length > 0) {
                console.log('✅ Found partial match:', containsElements[0]);
                return simulateClick(containsElements[0]);
            }

            // Finally, try any element with matching text
            const allElements = [...document.querySelectorAll('*')]
                .filter(el => isVisible(el) && 
                    getElementText(el).includes(searchText.toLowerCase()));

            if (allElements.length > 0) {
                console.log('✅ Found element by text:', allElements[0]);
                return simulateClick(allElements[0]);
            }

            console.log('❌ No matching clickable elements found');
            return false;
        };

        try {
            const result = await this.browserTab.executeScript(findAndClickScript, [this.text]);
            console.log('FindAndClick result:', result);
            if (!result?.[0]?.result) {
                throw new Error(`Could not find or click element with text: "${this.text}"`);
            }
            return result;
        } catch (error) {
            console.error('❌ FindAndClick error:', error);
            throw error;
        }
    }
}

class SmartFindAndClickCommand extends Command {
    constructor(options, browserTab) {
        super();
        this.options = options; // { text, index, price, priceRange }
        this.browserTab = browserTab;
        console.log(`🔍 Creating SmartFindAndClickCommand with options:`, options);
    }

    async execute() {
        const findAndClickScript = (options) => {
            console.log(`🔍 Running smart find and click script with options:`, options);
            
            // Helper function to check if element is visible
            const isVisible = (element) => {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0;
            };

            // Helper to extract price from text
            const extractPrice = (text) => {
                const priceMatch = text.match(/[0-9]+[.,][0-9]+/);
                return priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;
            };

            // Helper to get product information
            const getProductInfo = (element) => {
                const text = element.textContent.toLowerCase();
                const priceElement = element.querySelector('[class*="price"], [class*="valor"], .price, .valor');
                const price = priceElement ? extractPrice(priceElement.textContent) : null;
                
                return {
                    element,
                    text,
                    price,
                    visible: isVisible(element)
                };
            };

            // Find all product-like containers
            const findProducts = () => {
                const productSelectors = [
                    '[class*="product"]',
                    '[class*="item"]',
                    'article',
                    '.product',
                    '.item',
                    'li'
                ];
                
                const products = [];
                productSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(element => {
                        products.push(getProductInfo(element));
                    });
                });
                
                return [...new Set(products)];
            };

            // Smart matching function
            const matchesProduct = (product, options) => {
                if (!product.visible) return false;

                // Text matching
                if (options.text) {
                    const searchTerms = options.text.toLowerCase().split(' ');
                    if (!searchTerms.every(term => product.text.includes(term))) {
                        return false;
                    }
                }

                // Price matching
                if (options.price && product.price !== options.price) {
                    return false;
                }

                // Price range matching
                if (options.priceRange) {
                    if (!product.price || 
                        product.price < options.priceRange.min || 
                        product.price > options.priceRange.max) {
                        return false;
                    }
                }

                return true;
            };

            // Find matching products
            const products = findProducts();
            console.log(`📦 Found ${products.length} potential products`);
            
            const matches = products.filter(product => matchesProduct(product, options));
            console.log(`✨ Found ${matches.length} matching products`);

            if (matches.length === 0) {
                console.log('❌ No matching products found');
                return { success: false, message: 'No matching products found' };
            }

            // Handle index selection
            let selectedProduct;
            if (typeof options.index === 'number') {
                selectedProduct = matches[options.index];
            } else if (options.index === 'last') {
                selectedProduct = matches[matches.length - 1];
            } else {
                selectedProduct = matches[0];
            }

            if (!selectedProduct) {
                return { success: false, message: 'Selected product index out of range' };
            }

            // Scroll product into view if needed
            selectedProduct.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Click the product
            try {
                selectedProduct.element.click();
                return { success: true, message: 'Product clicked successfully' };
            } catch (error) {
                console.error('Click failed:', error);
                return { success: false, message: 'Failed to click product' };
            }
        };

        try {
            const result = await this.browserTab.executeScript(findAndClickScript, [this.options]);
            if (!result?.[0]?.success) {
                throw new Error(result?.[0]?.message || 'Failed to find or click product');
            }
            return result;
        } catch (error) {
            console.error('❌ SmartFindAndClick error:', error);
            throw error;
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new QAInterface();
});