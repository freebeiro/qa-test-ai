class ActionPlanner {
    constructor() {
        this.actions = null;
        this.initialized = false;
    }

    async loadActionDefinitions() {
        try {
            const response = await fetch('actions.json');
            this.actions = await response.json();
            this.initialized = true;
            console.log('Action definitions loaded successfully');
        } catch (error) {
            console.error('Failed to load action definitions:', error);
            throw error;
        }
    }

    async createActionSequence(analyzedCommand) {
        if (!this.initialized) {
            await this.loadActionDefinitions();
        }

        const sequence = [];
        console.log('Creating action sequence for:', analyzedCommand);

        for (const part of analyzedCommand.parts) {
            const actions = await this.planActionsForPart(part);
            sequence.push(...actions);
        }

        return sequence;
    }

    async planActionsForPart(commandPart) {
        console.log('Planning actions for part:', commandPart);
        
        switch (commandPart.type) {
            case 'navigation':
                return [{
                    type: 'navigation',
                    parameters: {
                        url: commandPart.parameters.url
                    }
                }];

            case 'search':
                return [{
                    type: 'search',
                    parameters: {
                        searchQuery: commandPart.parameters.searchQuery
                    }
                }];

            case 'addToCart':
                return [{
                    type: 'addToCart',
                    parameters: {
                        action: 'add'
                    }
                }];

            default:
                console.warn('Unknown command type:', commandPart.type);
                return [];
        }
    }
}

export default ActionPlanner;