class CommandParser {
    constructor() {
        this.patterns = new Map([
            ['navigation', /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i],
            ['search', /^search(?:\s+for)?\s+['"]?([^'"]+)['"]?$/i],
            // Add other patterns...
        ]);
    }

    parse(input) {
        for (const [type, pattern] of this.patterns) {
            const match = input.match(pattern);
            if (match) {
                return { type, params: this.extractParams(type, match) };
            }
        }
        return null;
    }

    extractParams(type, match) {
        switch(type) {
            case 'navigation':
                return { url: match[1] };
            case 'search':
                return { query: match[1] };
            // Add other parameter extractions...
        }
    }
}

export default CommandParser;
