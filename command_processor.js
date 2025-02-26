export class CommandProcessor {
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
            // Vision test command
            {
                type: 'test_vision',
                pattern: /^test\s+vision$/i,
                handler: () => ({ type: 'test_vision' })
            },
            // Smart click command
            {
                type: 'smartClick',
                pattern: /^click(?:\s+on)?\s+(?:the\s+)?([^\n]+)$/i,
                handler: (match) => ({
                    type: 'smartClick',
                    target: match[1].trim(),
                    useVision: true
                })
            },
            // Navigation commands
            {
                type: 'navigation',
                pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
                handler: (match) => ({ 
                    type: 'navigation', 
                    url: match[1].toLowerCase(),
                    skipFirstResult: false
                })
            },
            // Search command
            {
                type: 'search',
                pattern: /^search(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i,
                handler: (match) => ({ type: 'search', query: match[1] })
            },
            // Back command
            {
                type: 'back',
                pattern: /^back$/i,
                handler: () => ({ type: 'back' })
            },
            // Forward command
            {
                type: 'forward',
                pattern: /^forward$/i,
                handler: () => ({ type: 'forward' })
            },
            // Refresh command
            {
                type: 'refresh',
                pattern: /^refresh$/i,
                handler: () => ({ type: 'refresh' })
            },
            // Scroll commands
            {
                type: 'scroll',
                pattern: /^scroll\s+(up|down)$/i,
                handler: (match) => ({ 
                    type: 'scroll', 
                    direction: match[1].toLowerCase() 
                })
            },
            // Google search command
            {
                type: 'search',
                pattern: /^google\s+['"]?([^'"]+)['"]?$/i,
                handler: (match) => ({ 
                    type: 'search', 
                    query: match[1],
                    engine: 'google'
                })
            }
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
}
