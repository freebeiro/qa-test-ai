import { TestVisionCommand, LocateCommand } from './vision_commands.js';

export class CommandProcessor {
    constructor(browserTab) {
        this.browserTab = browserTab;
        console.log('🔧 Initializing CommandProcessor');
    }

    async processCommand(input) {
        const command = input.trim();
        console.log('Processing command:', command);

        try {
            // First try to parse as a standard command
            const commandObj = this.parseCommand(command);
            if (commandObj) {
                console.log('Command parsed as:', commandObj);
                return commandObj;
            }

            // Then try to parse as a locate command
            const findMatch = command.match(/^find\s+(.+)$/i);
            if (findMatch) {
                const query = findMatch[1];
                
                // Match "find Nth item in Section"
                const itemInSectionMatch = query.match(/(\d+)(?:st|nd|rd|th)?\s+item\s+in\s+(.+)/i);
                if (itemInSectionMatch) {
                    return new LocateCommand(this.browserTab, {
                        section: itemInSectionMatch[2],
                        itemIndex: parseInt(itemInSectionMatch[1])
                    });
                }

                // Match "find tab/button/link Text"
                const elementTypeMatch = query.match(/^(tab|button|link)\s+(.+)/i);
                if (elementTypeMatch) {
                    return new LocateCommand(this.browserTab, {
                        text: elementTypeMatch[2],
                        type: elementTypeMatch[1]
                    });
                }

                // Default to simple text search
                return new LocateCommand(this.browserTab, {
                    text: query
                });
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
            // Basic browser commands
            {
                type: 'back',
                pattern: /^back$/i,
                handler: () => ({ type: 'back' })
            },
            {
                type: 'forward',
                pattern: /^forward$/i,
                handler: () => ({ type: 'forward' })
            },
            {
                type: 'refresh',
                pattern: /^refresh$/i,
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
