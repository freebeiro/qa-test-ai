export class CommandProcessor {
  constructor() {
    console.log('Initializing CommandProcessor');
  }

  async processCommand(input) {
    const command = input.trim();
    console.log('Processing command:', command);
    return this.parseCommand(command);
  }

  parseCommand(input) {
    // Navigation
    if (/^(?:go|navigate|open|visit)(?:\s+to)?\s+(.+)/i.test(input)) {
      const url = input.match(/^(?:go|navigate|open|visit)(?:\s+to)?\s+(.+)/i)[1].trim();
      return { type: 'navigation', url };
    }
    
    // Scrolling
    if (/^scroll\s+(up|down)(?:\s+(\d+))?/i.test(input)) {
      const match = input.match(/^scroll\s+(up|down)(?:\s+(\d+))?/i);
      const direction = match[1].toLowerCase();
      const amount = match[2] ? parseInt(match[2]) : 300;
      return { 
        type: 'scroll', 
        direction, 
        amount: direction === 'up' ? -amount : amount 
      };
    }
    
    // Back/forward
    if (/^(?:go\s+)?back$/i.test(input)) {
      return { type: 'back' };
    }
    if (/^(?:go\s+)?forward$/i.test(input)) {
      return { type: 'forward' };
    }
    
    // Press enter
    if (/^press\s+enter$/i.test(input)) {
      return { type: 'press_enter' };
    }
    
    // Type in specific field
    if (/^type\s+(?:['"]?)(.+?)(?:['"]?)\s+in\s+(?:['"]?)(.+?)(?:['"]?)$/i.test(input)) {
      const match = input.match(/^type\s+(?:['"]?)(.+?)(?:['"]?)\s+in\s+(?:['"]?)(.+?)(?:['"]?)$/i);
      return {
        type: 'input_targeted',
        text: match[1].trim(),
        target: match[2].trim()
      };
    }
    
    // Type general
    if (/^type\s+(?:['"]?)(.+?)(?:['"]?)$/i.test(input)) {
      const text = input.match(/^type\s+(?:['"]?)(.+?)(?:['"]?)$/i)[1].trim();
      return { type: 'input', text };
    }
    
    // Click
    if (/^click\s+(.+)$/i.test(input)) {
      const text = input.match(/^click\s+(.+)$/i)[1].trim();
      return { type: 'click', text };
    }
    
    console.log('No pattern matched for input:', input);
    return null;
  }
}
