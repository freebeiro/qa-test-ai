import Command from '../core/command.js';

class RefreshCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
    }

    async execute() {
        return await chrome.tabs.reload(this.browserTab.tabId);
    }
}

export default RefreshCommand;
