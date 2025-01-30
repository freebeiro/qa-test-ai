class NaturalLanguageProcessor {
    constructor() {
        this.patterns = null;
        this.initialized = false;
    }

    async loadPatterns() {
        try {
            const response = await fetch('patterns.json');
            this.patterns = await response.json();
            this.initialized = true;
            console.log('NLP patterns loaded successfully');
        } catch (error) {
            console.error('Failed to load NLP patterns:', error);
            throw error;
        }
    }

    async analyzeCommand(input) {
        if (!this.initialized) {
            await this.loadPatterns();
        }

        // For individual commands, first try to understand the type
        const commandType = this.identifyCommandType(input);
        console.log('Identified command type:', commandType);

        // Now analyze the command in detail
        const analyzedCommand = this.analyzeCommandPart(input);
        console.log('Command analysis:', analyzedCommand);

        return {
            original: input,
            parts: [analyzedCommand]
        };
    }

    identifyCommandType(input) {
        const normalizedInput = input.toLowerCase().trim();
        
        // Check for navigation indicators
        if (/^(?:go to|open|visit|navigate to)\s+/i.test(normalizedInput)) {
            return 'Navigation command - Moving to a new webpage';
        }
        
        // Check for search indicators
        if (/^(?:search for|find|look for)\s+/i.test(normalizedInput)) {
            return 'Search command - Looking for specific content';
        }
        
        // Check for cart interactions
        if (/^(?:add to|put in|place in)\s+(?:the\s+)?cart/i.test(normalizedInput)) {
            return 'Cart command - Modifying shopping cart';
        }
        
        // Check for click interactions
        if (/^(?:click|press|select)\s+/i.test(normalizedInput)) {
            return 'Click command - Interacting with page element';
        }
        
        // Check for form inputs
        if (/^(?:type|enter|input|fill)\s+/i.test(normalizedInput)) {
            return 'Input command - Entering data into form';
        }

        return 'Unknown command type - Please try rephrasing';
    }

    analyzeCommandPart(command) {
        // First try navigation
        const navigationMatch = this.matchNavigationCommand(command);
        if (navigationMatch) {
            console.log('Recognized as navigation command:', navigationMatch);
            return {
                type: 'navigation',
                parameters: navigationMatch,
                original: command,
                explanation: 'Will navigate to the specified webpage'
            };
        }

        // Then try search
        const searchMatch = this.matchSearchCommand(command);
        if (searchMatch) {
            console.log('Recognized as search command:', searchMatch);
            return {
                type: 'search',
                parameters: searchMatch,
                original: command,
                explanation: 'Will search for the specified terms'
            };
        }

        // Then try cart operations
        const cartMatch = this.matchCartCommand(command);
        if (cartMatch) {
            console.log('Recognized as cart command:', cartMatch);
            return {
                type: 'addToCart',
                parameters: cartMatch,
                original: command,
                explanation: 'Will add current item to shopping cart'
            };
        }

        // If no matches, return unknown with suggestion
        return {
            type: 'unknown',
            original: command,
            explanation: 'Command not recognized. Try using clear actions like "go to", "search for", or "add to cart"'
        };
    }

    matchNavigationCommand(command) {
        const navigationPattern = /(?:go to|navigate to|open|visit)\s+([^\s]+)/i;
        const match = command.match(navigationPattern);
        
        if (match) {
            return {
                url: match[1],
                explanation: `Will navigate to ${match[1]}`
            };
        }
        return null;
    }

    matchSearchCommand(command) {
        const searchPattern = /search for ['"]([^'"]+)['"]/i;
        const match = command.match(searchPattern);
        
        if (match) {
            return {
                searchQuery: match[1],
                explanation: `Will search for "${match[1]}"`
            };
        }
        return null;
    }

    matchCartCommand(command) {
        const cartPattern = /add (?:to|in|into|to the)? ?cart/i;
        if (cartPattern.test(command)) {
            return {
                action: 'add',
                explanation: 'Will add current item to cart'
            };
        }
        return null;
    }
}

export default NaturalLanguageProcessor;