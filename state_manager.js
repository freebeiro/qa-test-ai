// This module manages state and context throughout command execution
class StateManager {
    constructor() {
        this.contexts = new Map();
        this.currentState = null;
    }

    createContext(actionSequence) {
        const context = {
            id: this.generateContextId(),
            sequence: actionSequence,
            state: {
                currentUrl: null,
                currentPage: null,
                lastAction: null,
                variables: new Map(),
                history: []
            },
            created: new Date(),
            updated: new Date()
        };

        this.contexts.set(context.id, context);
        return context;
    }

    async enrichActionWithContext(action, context) {
        // Add relevant context to the action before execution
        const enrichedAction = { ...action };
        const state = context.state;

        // Add state information
        enrichedAction.context = {
            currentUrl: state.currentUrl,
            currentPage: state.currentPage,
            lastAction: state.lastAction,
            variables: new Map(state.variables)
        };

        // Add dynamic selectors based on page context
        if (action.type === 'interaction') {
            enrichedAction.selectors = await this.generateDynamicSelectors(action, context);
        }

        // Add verification strategies
        enrichedAction.verification = await this.determineVerificationStrategy(action, context);

        return enrichedAction;
    }

    async updateState(context, result) {
        const state = context.state;

        // Update basic state information
        if (result.type === 'navigation') {
            state.currentUrl = result.url;
            state.currentPage = await this.analyzePageContext(result.url);
        }

        // Store action result
        state.lastAction = {
            type: result.type,
            timestamp: new Date(),
            success: result.success,
            details: result.details
        };

        // Update variables based on action result
        if (result.variables) {
            for (const [key, value] of Object.entries(result.variables)) {
                state.variables.set(key, value);
            }
        }

        // Add to history
        state.history.push({
            timestamp: new Date(),
            action: result
        });

        // Update context
        context.updated = new Date();
        this.contexts.set(context.id, context);

        return context;
    }

    async generateDynamicSelectors(action, context) {
        // Load dynamic selector patterns
        const patterns = await this.loadSelectorPatterns();
        
        // Generate selectors based on action type and context
        const selectors = new Map();
        
        if (action.target) {
            selectors.set('primary', await this.generateSelector(action.target, patterns, context));
        }
        
        if (action.type === 'input' && action.field) {
            selectors.set('input', await this.generateSelector(action.field, patterns, context));
        }
        
        return selectors;
    }

    async determineVerificationStrategy(action, context) {
        // Load verification strategies
        const strategies = await this.loadVerificationStrategies();
        
        // Select appropriate strategy based on action type and context
        const strategy = strategies[action.type] || strategies.default;
        
        return {
            ...strategy,
            context: this.getVerificationContext(action, context)
        };
    }

    async analyzePageContext(url) {
        // Analyze the current page to understand its context
        try {
            const urlObj = new URL(url);
            return {
                domain: urlObj.hostname,
                path: urlObj.pathname,
                queryParams: Object.fromEntries(urlObj.searchParams),
                type: await this.determinePageType(url)
            };
        } catch (error) {
            console.error('Error analyzing page context:', error);
            return null;
        }
    }

    async loadSelectorPatterns() {
        try {
            const response = await fetch('actions.json');
            const actions = await response.json();
            return actions.selectors.dynamic;
        } catch (error) {
            console.error('Error loading selector patterns:', error);
            return {};
        }
    }

    async loadVerificationStrategies() {
        try {
            const response = await fetch('actions.json');
            const actions = await response.json();
            return actions.verifications;
        } catch (error) {
            console.error('Error loading verification strategies:', error);
            return {};
        }
    }

    getVerificationContext(action, context) {
        return {
            timeout: action.timeout || 5000,
            retries: action.retries || 3,
            state: context.state
        };
    }

    async generateSelector(target, patterns, context) {
        // Generate a selector based on the target description and page context
        const selectors = [];
        
        // Try exact matches first
        if (patterns[target]) {
            selectors.push(...patterns[target]);
        }
        
        // Generate contextual selectors
        const contextualSelectors = await this.generateContextualSelectors(target, context);
        selectors.push(...contextualSelectors);
        
        return selectors;
    }

    async generateContextualSelectors(target, context) {
        // Generate selectors based on the current page context
        const selectors = [];
        
        // Add common attribute selectors
        selectors.push(
            `[aria-label*="${target}"]`,
            `[title*="${target}"]`,
            `[placeholder*="${target}"]`,
            `[name*="${target}"]`
        );
        
        // Add text content selectors
        selectors.push(
            `//*[contains(text(),"${target}")]`,
            `//*[contains(@*,"${target}")]`
        );
        
        return selectors;
    }

    async determinePageType(url) {
        // Analyze URL and page structure to determine the type of page
        const urlObj = new URL(url);
        const path = urlObj.pathname.toLowerCase();
        
        if (path.includes('product') || path.includes('item')) {
            return 'product';
        }
        if (path.includes('search') || path.includes('find')) {
            return 'search';
        }
        if (path.includes('cart') || path.includes('basket')) {
            return 'cart';
        }
        if (path.includes('checkout') || path.includes('payment')) {
            return 'checkout';
        }
        
        return 'unknown';
    }

    generateContextId() {
        return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

export default StateManager;