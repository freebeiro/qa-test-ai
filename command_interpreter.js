// Command Interpreter for UI-TARS
// This module handles the translation between natural language commands and UI-TARS actions

class CommandInterpreter {
    constructor() {
        this.commands = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            const response = await fetch('commands.json');
            this.commands = await response.json();
            this.initialized = true;
            console.log('Command interpreter initialized with UI-TARS capabilities');
        } catch (error) {
            console.error('Failed to initialize command interpreter:', error);
            throw error;
        }
    }

    interpretCommand(userInput) {
        if (!this.initialized) {
            throw new Error('Command interpreter not initialized');
        }

        const input = userInput.toLowerCase().trim();
        
        // First, try to match exact UI-TARS commands
        const exactCommand = this.matchExactCommand(input);
        if (exactCommand) {
            return exactCommand;
        }

        // If no exact match, try natural language interpretation
        return this.interpretNaturalLanguage(input);
    }

    matchExactCommand(input) {
        const allCommands = this.commands.browser_commands;
        
        for (const category in allCommands) {
            for (const command in allCommands[category]) {
                const cmdInfo = allCommands[category][command];
                if (input === cmdInfo.syntax || input.startsWith(cmdInfo.syntax.split(' ')[0])) {
                    return {
                        type: 'exact',
                        category,
                        command,
                        parameters: this.extractParameters(input, cmdInfo)
                    };
                }
            }
        }
        return null;
    }

    interpretNaturalLanguage(input) {
        const nlMapping = this.commands.command_processing.natural_language_mapping;
        
        // Check each category of natural language phrases
        for (const [actionType, phrases] of Object.entries(nlMapping)) {
            for (const phrase of phrases) {
                if (input.includes(phrase)) {
                    return this.createActionPlan(actionType, input);
                }
            }
        }

        return {
            type: 'unknown',
            originalInput: input,
            message: 'Could not interpret command'
        };
    }

    extractParameters(input, commandInfo) {
        if (!commandInfo.parameters.length) {
            return {};
        }

        const parts = input.split(' ');
        const commandParts = commandInfo.syntax.split(' ');
        const params = {};

        commandInfo.parameters.forEach((param, index) => {
            const paramValue = parts.slice(commandParts.length).join(' ');
            if (paramValue) {
                params[param] = paramValue;
            }
        });

        return params;
    }

    createActionPlan(actionType, input) {
        switch (actionType) {
            case 'navigation':
                return this.createNavigationPlan(input);
            case 'clicking':
                return this.createClickPlan(input);
            case 'typing':
                return this.createTypingPlan(input);
            default:
                return {
                    type: 'unknown',
                    originalInput: input,
                    message: 'Unsupported action type'
                };
        }
    }

    createNavigationPlan(input) {
        // Extract URL from navigation command
        const urlMatch = input.match(/(?:go to|navigate to|open|visit)\s+(.+)/i);
        if (urlMatch) {
            return {
                type: 'navigation',
                command: 'open',
                parameters: {
                    url: urlMatch[1].trim()
                }
            };
        }
        return null;
    }

    createClickPlan(input) {
        // Extract element identifier from click command
        const elementMatch = input.match(/(?:click|press|select|choose)\s+(?:the\s+)?(.+)/i);
        if (elementMatch) {
            return {
                type: 'interaction',
                command: 'click',
                parameters: {
                    element_identifier: elementMatch[1].trim()
                }
            };
        }
        return null;
    }

    createTypingPlan(input) {
        // Extract text and target from typing command
        const typingMatch = input.match(/(?:type|enter|input|fill)\s+['"](.+?)['"]\s+(?:into|in)\s+(?:the\s+)?(.+)/i);
        if (typingMatch) {
            return {
                type: 'interaction',
                command: 'type',
                parameters: {
                    text: typingMatch[1],
                    target: typingMatch[2].trim()
                }
            };
        }
        return null;
    }
}

export default CommandInterpreter;