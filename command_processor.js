export class CommandProcessor {
    constructor(browserTab) {
        this.browserTab = browserTab;
        console.log('🔧 Initializing CommandProcessor');
    }

    async processCommand(input) {
        const command = input.trim();
        console.log('Processing command:', command);

        try {
            // Parse as a standard command
            const commandObj = this.parseCommand(command);
            if (commandObj) {
                console.log('Command parsed as:', commandObj);
                return commandObj;
            }

            throw new Error('Unknown command');
        } catch (error) {
            console.error('Command processing failed:', error);
            throw new Error(`Command processing failed: ${error.message}`);
        }
    }

    parseCommand(input) {
        console.log('Parsing command:', input);
        
        const commands = [
            // Mouse coordinate movement command
            {
                type: 'mouse_move_coords',
                pattern: /^move mouse to coordinates (\d+) (\d+)$/i,
                handler: (match) => ({
                    type: 'mouse_move_coords',
                    x: parseInt(match[1]),
                    y: parseInt(match[2])
                })
            },
            // Click command
            {
                type: 'click',
                pattern: /^click\s+(.+)$/i,
                handler: (match) => ({
                    type: 'click',
                    text: match[1].trim()
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
            // Search commands
            {
                type: 'search',
                pattern: /^(?:search|find text)\s+(.+)$/i,
                handler: (match) => ({
                    type: 'search',
                    text: match[1].trim()
                })
            },
            // Input/Type commands
            {
                type: 'input',
                pattern: /^(?:type|input|enter|fill|write)\s+(?:in|into)?\s*(?:the\s+)?(?:field|input|form|box|textarea)?\s*(?:with|labeled|named)?\s*["']?([^"']+)["']?\s+(?:with|as)?\s+["']?(.+?)["']?$/i,
                handler: (match) => ({
                    type: 'input',
                    field: match[1].trim(),
                    text: match[2].trim()
                })
            },
            // Simple input command (just type text)
            {
                type: 'input_simple',
                pattern: /^(?:type|input|enter|fill|write)\s+["']?(.+?)["']?$/i,
                handler: (match) => ({
                    type: 'input',
                    text: match[1].trim()
                })
            },
            // Press Enter command
            {
                type: 'press_enter',
                pattern: /^(?:press\s+enter|hit\s+enter|submit|enter)$/i,
                handler: () => ({
                    type: 'press_enter'
                })
            },
            // Back command
            {
                type: 'back',
                pattern: /^(?:go\s+)?back$/i,
                handler: () => ({ type: 'back' })
            },
            // Forward command
            {
                type: 'forward',
                pattern: /^(?:go\s+)?forward$/i,
                handler: () => ({ type: 'forward' })
            },
            // Refresh command
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

        console.log('❌ No pattern matched for input:', input);
        return null;
    }
}
