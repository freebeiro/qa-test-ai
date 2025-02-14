import Command from '../core/command.js';

class FindCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
        console.log('🔍 Creating FindCommand:', text);
    }

    async execute() {
        console.log('🔍 Executing find command:', this.text);
        try {
            const result = await this.browserTab.executeScript((searchText) => {
                // First try using browser's find
                if (window.find) {
                    window.find(searchText, false, false, true, false, false, false);
                    return true;
                }

                // Fallback to manual search if window.find not available
                const textNodes = document.evaluate(
                    `//*[contains(text(),'${searchText}')]`,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                const element = textNodes.singleNodeValue;
                if (element) {
                    // Scroll element into view
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return true;
                }

                return false;
            }, [this.text]);

            // Wait for scroll animation
            await new Promise(resolve => setTimeout(resolve, 500));

            return result;
        } catch (error) {
            console.error('❌ Find command failed:', error);
            throw error;
        }
    }
}

export default FindCommand;