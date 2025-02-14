import Command from '../core/command.js';

class ForwardCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('➡️ Creating ForwardCommand');
    }

    async execute() {
        console.log('➡️ Executing forward command');
        try {
            // Execute the forward navigation using chrome.scripting
            await this.browserTab.executeScript(() => {
                window.history.forward();
                return true;
            });
            
            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
        } catch (error) {
            console.error('❌ Forward navigation failed:', error);
            throw error;
        }
    }
}

export default ForwardCommand;