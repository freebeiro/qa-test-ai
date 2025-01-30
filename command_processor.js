import UITarsClient from './ui_tars_client.js';

class CommandProcessor {
    constructor(config) {
        this.uiTars = new UITarsClient(config);
        this.pageState = null;
        console.log('🔧 Initializing CommandProcessor');
    }

    async processCommand(userInput, pageState = null) {
        console.log('🎯 Processing command:', userInput);

        try {
            if (!pageState) {
                // Get page state if not provided
                pageState = await this.getDefaultPageState();
            }

            // First check for basic navigation commands for fast path
            const navigationCmd = this.checkForNavigation(userInput);
            if (navigationCmd) {
                return {
                    type: 'navigation',
                    actions: [navigationCmd]
                };
            }

            // Get UI-TARS analysis
            const analysis = await this.uiTars.analyze(userInput, pageState);
            console.log('📝 Command analysis:', analysis);

            // Create actions from analysis
            const actions = await this.createActionsFromAnalysis(analysis);

            return {
                type: analysis.command?.type || 'unknown',
                actions: actions,
                analysis: analysis
            };

        } catch (error) {
            console.error('❌ Command processing failed:', error);
            // Return a basic navigation or search action as fallback
            return this.getFallbackAction(userInput);
        }
    }

    checkForNavigation(input) {
        const navigationMatch = input.match(/^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i);
        if (navigationMatch) {
            return {
                type: 'navigation',
                parameters: {
                    url: navigationMatch[1]
                }
            };
        }
        return null;
    }

    async getDefaultPageState() {
        return {
            url: window.location.href,
            title: document.title,
            screenshot: null, // Will be captured when needed
            dom: document.documentElement.outerHTML
        };
    }

    getFallbackAction(userInput) {
        // Check if it looks like a navigation command
        const navigationMatch = this.checkForNavigation(userInput);
        if (navigationMatch) {
            return {
                type: 'navigation',
                actions: [navigationMatch]
            };
        }

        // Check if it looks like a search command
        const searchMatch = userInput.match(/^(?:search|find|look)(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i);
        if (searchMatch) {
            return {
                type: 'search',
                actions: [{
                    type: 'search',
                    parameters: {
                        searchQuery: searchMatch[1]
                    }
                }]
            };
        }

        return {
            type: 'unknown',
            actions: []
        };
    }
}

export default CommandProcessor;