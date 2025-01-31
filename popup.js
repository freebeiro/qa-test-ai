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
            // Navigation commands first
            {
                type: 'back',
                pattern: /^(?:go\s+)?back$/i,
                handler: () => ({ type: 'back' })
            },
            {
                type: 'forward',
                pattern: /^(?:go\s+)?forward$/i,
                handler: () => ({ type: 'forward' })
            },
            // Find and click before find to prevent pattern overlap
            {
                type: 'findAndClick',
                pattern: /^find\s+and\s+click\s+(?:text\s+)?(?:["']([^"']+)["']|(\S+(?:\s+\S+)*))$/i,
                handler: (match) => ({ type: 'findAndClick', text: match[1] || match[2] })
            },
            // Then find
            {
                type: 'find',
                pattern: /^find\s+(?:text\s+)?(?:["']([^"']+)["']|(\S+(?:\s+\S+)*))$/i,
                handler: (match) => ({ type: 'find', text: match[1] || match[2] })
            },
            // Navigation with specific pattern
            {
                type: 'navigation',
                pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
                handler: (match) => ({ type: 'navigation', url: match[1] })
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

// Command interface
class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }
}

// Concrete commands
class NavigationCommand extends Command {
    constructor(url, browserTab) {
        super();
        this.url = url;
        this.browserTab = browserTab;
    }

    async execute() {
        return await this.browserTab.navigate(this.url);
    }
}

// Command factory
class CommandFactory {
    static createCommand(type, params, browserTab) {
        switch(type) {
            case 'navigation':
                return new NavigationCommand(params.url, browserTab);
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
    constructor(tabId) {
        this.tabId = tabId;
        console.log(`🔧 Initializing BrowserTabManager with tabId: ${tabId}`);
    }

    async navigate(url) {
        url = url.startsWith('http') ? url : `https://${url}`;
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
        const elements = this.initializeUI();
        this.elements = elements;
        this.uiManager = new UIManager(elements);
        this.commandParser = new CommandParser();
        this.commandProcessor = new CommandProcessor();
        this.browserTabId = null;
        this.isNavigating = false;
        this.setupEventListeners();
        this.connectToBackground();
    }

    initializeUI() {
        return {
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
                // Initialize browserTab when we get the ID
                this.browserTab = new BrowserTabManager(this.browserTabId);
            }
        });
    }

    async handleCommand(userInput) {
        if (!userInput.trim() || !this.browserTabId) {
            console.log('⚠️ Invalid input or no browser tab ID');
            return;
        }

        console.log(`🎯 Processing command: "${userInput}"`);
        try {
            this.uiManager.toggleControls(false);
            this.uiManager.addMessage(userInput, 'user');

            let commandData = null;

            console.log('🔍 Attempting command processor');
            commandData = await this.commandProcessor.processCommand(userInput);
            
            if (!commandData) {
                console.log('🔍 Attempting command parser');
                const parsedCommand = this.commandParser.parse(userInput);
                if (parsedCommand) {
                    commandData = parsedCommand;
                }
            }

            if (!commandData) {
                console.log('❌ Unknown command');
                this.uiManager.addMessage('Unknown command', 'error');
                return;
            }

            console.log('✅ Command data:', commandData);
            const command = CommandFactory.createCommand(
                commandData.type,
                commandData.params || commandData,
                this.browserTab
            );

            if (command) {
                console.log(`🚀 Executing command of type: ${commandData.type}`);
                await command.execute();
                this.isNavigating = true;
                await this.captureAndShowScreenshot();
            } else {
                console.log('❌ Command not implemented');
                this.uiManager.addMessage('Command not implemented', 'error');
            }

        } catch (error) {
            console.error('❌ Command execution failed:', error);
            this.uiManager.addMessage(`Error: ${error.message}`, 'error');
        } finally {
            this.uiManager.toggleControls(true);
        }
    }

    async handleTabUpdate() {
        await this.captureAndShowScreenshot();
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
            this.handleError(error, 'Screenshot');
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
        this.elements.chat.innerHTML = '';
        this.elements.chat.appendChild(document.createTextNode('Ready! Try commands like:'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "go to google.com"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "search for \'something\'"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "find \'text on page\'"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "find and click \'text\'"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "click on \'Login\'"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "scroll down/up"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "go back"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "go forward"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createTextNode('- "refresh"'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.appendChild(document.createElement('br'));
        this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
    }

    handleError(error, operation) {
        console.error(`❌ ${operation} failed:`, error);
        this.uiManager.addMessage(`${operation} failed: ${error.message}`, 'error');
        this.uiManager.toggleControls(true);
    }
}

// Add missing command classes
class SearchCommand extends Command {
    constructor(query, browserTab) {
        super();
        this.query = query;
        this.browserTab = browserTab;
    }

    async execute() {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(this.query)}`;
        return await this.browserTab.navigate(searchUrl);
    }
}

class BackCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
    }

    async execute() {
        return await chrome.tabs.goBack(this.browserTab.tabId);
    }
}

class ForwardCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
    }

    async execute() {
        return await chrome.tabs.goForward(this.browserTab.tabId);
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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    new QAInterface();
});