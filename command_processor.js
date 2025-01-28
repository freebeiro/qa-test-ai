import UITarsClient from './ui_tars_client.js';

class CommandProcessor {
    constructor(config) {
        this.uiTars = new UITarsClient(config);
        this.initialized = false;
    }

    async processCommand(userInput) {
        console.log('Processing command:', userInput);

        // First try to identify basic commands without UI-TARS
        const basicCommand = this.identifyBasicCommand(userInput);
        if (basicCommand) {
            return {
                type: basicCommand.type,
                actions: [basicCommand]
            };
        }

        // If it's not a basic command, try UI-TARS analysis
        try {
            const commandType = await this.analyzeCommandType(userInput);
            console.log('UI-TARS identified command type:', commandType);

            const context = this.createContext(commandType, userInput);

            if (commandType.requiresPageAnalysis) {
                const dom = await this.getCurrentPageDOM();
                const analysis = await this.uiTars.analyze(userInput, dom, context);
                
                return {
                    type: commandType.type,
                    actions: this.createActionsFromAnalysis(analysis)
                };
            }
        } catch (error) {
            console.error('UI-TARS analysis failed:', error);
            // For navigation commands, fall back to basic handling
            const fallbackCommand = this.handleCommandFallback(userInput);
            if (fallbackCommand) {
                return {
                    type: fallbackCommand.type,
                    actions: [fallbackCommand]
                };
            }
            throw error;
        }
    }

    identifyBasicCommand(input) {
        // Handle navigation commands directly
        const navigationMatch = input.match(/^(?:go to|navigate to|open|visit)\s+([^\s]+)/i);
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

    handleCommandFallback(input) {
        // Fallback handling for when UI-TARS is unavailable
        const searchMatch = input.match(/^search for ['"]([^'"]+)['"]/i);
        if (searchMatch) {
            return {
                type: 'search',
                parameters: {
                    searchQuery: searchMatch[1]
                }
            };
        }
        return null;
    }

    async analyzeCommandType(input) {
        return await this.uiTars.analyze(input);
    }

    createContext(commandType, userInput) {
        return {
            action: commandType.type,
            requirements: [],
            parameters: this.extractParameters(userInput, commandType)
        };
    }

    extractParameters(input, commandType) {
        switch (commandType.type) {
            case 'search':
                const searchMatch = input.match(/['"]([^'"]+)['"]/);
                return {
                    searchQuery: searchMatch ? searchMatch[1] : input.replace(/^search for\s+/, '')
                };
            default:
                return {};
        }
    }
}

export default CommandProcessor;