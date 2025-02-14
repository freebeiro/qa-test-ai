import Command from '../core/command.js';

class BackCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        console.log('⬅️ Creating BackCommand');
    }

    async execute() {
        console.log('⬅️ Executing back command');
        try {
            // Execute the back navigation using chrome.scripting
            await this.browserTab.executeScript(() => {
                window.history.back();
                return true;
            });
            
            // Wait for navigation
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return true;
        } catch (error) {
            console.error('❌ Back navigation failed:', error);
            throw error;
        }
    }
}

export default BackCommand;