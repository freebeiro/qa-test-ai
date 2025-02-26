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
            // Ordinal click command (click first/second/third/etc. item/result/tab/etc.)
            {
                type: 'ordinal_click',
                pattern: /^click\s+(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th|last|[0-9]+(?:st|nd|rd|th)?)\s+(.+)$/i,
                handler: (match) => {
                    // Convert ordinal text to number
                    let position = match[1].toLowerCase();
                    let positionNumber = 0;
                    
                    if (position === 'first' || position === '1st') {
                        positionNumber = 0; // Zero-based index
                    } else if (position === 'second' || position === '2nd') {
                        positionNumber = 1;
                    } else if (position === 'third' || position === '3rd') {
                        positionNumber = 2;
                    } else if (position === 'fourth' || position === '4th') {
                        positionNumber = 3;
                    } else if (position === 'fifth' || position === '5th') {
                        positionNumber = 4;
                    } else if (position === 'last') {
                        positionNumber = -1; // Special value for last item
                    } else {
                        // Extract number from string like "1st", "2nd", etc.
                        const num = parseInt(position);
                        if (!isNaN(num)) {
                            positionNumber = num - 1; // Convert to zero-based index
                        }
                    }
                    
                    return {
                        type: 'ordinal_click',
                        position: positionNumber,
                        elementType: match[2].trim()
                    };
                }
            },
            // Standard click command
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
