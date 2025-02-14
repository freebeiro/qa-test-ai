class CommandProcessor {
    constructor() {
        console.log('🔧 Initializing CommandProcessor');
    }

    async processCommand(userInput) {
        if (!userInput.trim()) return null;

        try {
            const command = this.parseCommand(userInput);
            console.log('✅ Parsed command:', command);
            return command;
        } catch (error) {
            throw new Error(`Command processing failed: ${error.message}`);
        }
    }

    parseCommand(input) {
        const commands = [
            // Navigation commands
            {
                type: 'navigation',
                pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
                handler: (match) => ({ 
                    type: 'navigation', 
                    url: match[1].toLowerCase()
                })
            },
            // Back/Forward commands
            {
                type: 'back',
                pattern: /^(?:back|backward|backwards|go\s+back)$/i,
                handler: () => ({ type: 'back' })
            },
            {
                type: 'forward',
                pattern: /^(?:forward|forwards|go\s+forward)$/i,
                handler: () => ({ type: 'forward' })
            },
            // Find commands
            {
                type: 'find',
                pattern: /^find\s+["']?([^"']+)["']?$/i,
                handler: (match) => ({ 
                    type: 'find',
                    text: match[1]
                })
            },
            // Click commands
            {
                type: 'click',
                pattern: /^click\s+["']?([^"']+)["']?$/i,
                handler: (match) => ({
                    type: 'click',
                    target: match[1]
                })
            },
            // Scroll commands
            {
                type: 'scroll',
                pattern: /^scroll\s+(up|down|top|bottom)$/i,
                handler: (match) => ({ 
                    type: 'scroll',
                    direction: match[1] 
                })
            },
            // Utility commands
            {
                type: 'refresh',
                pattern: /^(?:refresh|reload)$/i,
                handler: () => ({ type: 'refresh' })
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

export default CommandProcessor;