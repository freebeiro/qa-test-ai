// Import the vision service for vision-enhanced commands
import { VisionService } from './vision_service.js';

// Base Command class for all commands
export class Command {
    execute() {
        throw new Error('Command must implement execute method');
    }
}

// Navigation Command for handling URL navigation
export class NavigationCommand extends Command {
    constructor(url, browserTab, skipFirstResult = false) {
        super();
        this.url = url;
        this.browserTab = browserTab;
        this.skipFirstResult = skipFirstResult;
        console.log(`🌐 Creating NavigationCommand for: ${this.url}`);
    }

    async execute() {
        // Navigation implementation remains the same
        try {
            await this.browserTab.navigate(this.url);
            return true;
        } catch (error) {
            console.error('Navigation failed:', error);
            throw error;
        }
    }
}

// Search Command for handling search operations
export class SearchCommand extends Command {
    constructor(query, browserTab) {
        super();
        this.query = query;
        this.browserTab = browserTab;
        console.log(`🔍 Creating SearchCommand for: "${query}"`);
    }

    async execute() {
        try {
            // Search implementation
            const searchScript = (query) => {
                const searchInput = document.querySelector('input[type="search"]');
                if (searchInput) {
                    searchInput.value = query;
                    searchInput.dispatchEvent(new Event('input'));
                    return true;
                }
                return false;
            };

            return await this.browserTab.executeScript(searchScript, [this.query]);
        } catch (error) {
            console.error('Search failed:', error);
            throw error;
        }
    }
}

// Back Command for browser history navigation
export class BackCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('⬅️ Creating BackCommand');
    }

    async execute() {
        try {
            await this.browserTab.executeScript(() => window.history.back());
            return true;
        } catch (error) {
            console.error('Back navigation failed:', error);
            throw error;
        }
    }
}

// Forward Command for browser history navigation
export class ForwardCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('➡️ Creating ForwardCommand');
    }

    async execute() {
        try {
            await this.browserTab.executeScript(() => window.history.forward());
            return true;
        } catch (error) {
            console.error('Forward navigation failed:', error);
            throw error;
        }
    }
}

// Refresh Command for page reloading
export class RefreshCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('🔄 Creating RefreshCommand');
    }

    async execute() {
        try {
            await this.browserTab.executeScript(() => window.location.reload());
            return true;
        } catch (error) {
            console.error('Refresh failed:', error);
            throw error;
        }
    }
}

// Scroll Command for page scrolling
export class ScrollCommand extends Command {
    constructor(direction, browserTab) {
        super();
        this.direction = direction;
        this.browserTab = browserTab;
        console.log(`🔄 Creating ScrollCommand: ${direction}`);
    }

    async execute() {
        try {
            const scrollScript = (direction) => {
                switch(direction) {
                    case 'up': window.scrollBy(0, -300); break;
                    case 'down': window.scrollBy(0, 300); break;
                    case 'top': window.scrollTo(0, 0); break;
                    case 'bottom': window.scrollTo(0, document.body.scrollHeight); break;
                }
                return true;
            };

            return await this.browserTab.executeScript(scrollScript, [this.direction]);
        } catch (error) {
            console.error('Scroll failed:', error);
            throw error;
        }
    }
}

// Find Command for text finding
export class FindCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
        console.log(`🔍 Creating FindCommand for: "${text}"`);
    }

    async execute() {
        try {
            const findScript = (searchText) => {
                return window.find(searchText);
            };
            return await this.browserTab.executeScript(findScript, [this.text]);
        } catch (error) {
            console.error('Find failed:', error);
            throw error;
        }
    }
}

// FindAndClick Command for finding and clicking elements
export class FindAndClickCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
        console.log(`🎯 Creating FindAndClickCommand for: "${text}"`);
    }

    async execute() {
        try {
            const findAndClickScript = (searchText) => {
                const elements = document.querySelectorAll('*');
                for (const element of elements) {
                    if (element.textContent?.includes(searchText)) {
                        element.click();
                        return true;
                    }
                }
                return false;
            };
            return await this.browserTab.executeScript(findAndClickScript, [this.text]);
        } catch (error) {
            console.error('FindAndClick failed:', error);
            throw error;
        }
    }
}

// End of command classes
