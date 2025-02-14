import Command from '../core/command.js';

class SearchCommand extends Command {
    constructor(query, browserTab) {
        super();
        this.query = query;
        this.browserTab = browserTab;
        console.log(`🔍 Creating SearchCommand for query: "${query}"`);
    }

    async execute() {
        console.log(`🔍 Executing SearchCommand for: "${this.query}"`);
        
        const searchScript = (searchQuery) => {
            console.log(`🔍 Running search script for: "${searchQuery}"`);
            
            const findSearchElements = () => {
                // Priority-based search input selectors
                const searchInputSelectors = [
                    // Priority 1: Standard search inputs
                    'input[type="search"]',
                    'input[role="search"]',
                    
                    // Priority 2: Common search patterns
                    'input[name="q"]',
                    'input[name="query"]',
                    'input[name="search"]',
                    
                    // Priority 3: Attribute-based search
                    'input[id*="search" i]',
                    'input[class*="search" i]',
                    'input[placeholder*="search" i]',
                    'input[aria-label*="search" i]',
                    
                    // Priority 4: Generic form inputs
                    'form input[type="text"]'
                ];

                // Find search input
                let searchInput = null;
                for (const selector of searchInputSelectors) {
                    const input = document.querySelector(selector);
                    if (input && input.offsetParent !== null) {
                        searchInput = input;
                        break;
                    }
                }

                // Find associated search button
                let searchButton = null;
                if (searchInput?.form) {
                    const buttonSelectors = [
                        'button[type="submit"]',
                        'input[type="submit"]',
                        'button[aria-label*="search" i]',
                        'button[title*="search" i]',
                        '[role="button"][aria-label*="search" i]'
                    ];

                    for (const selector of buttonSelectors) {
                        const button = searchInput.form.querySelector(selector);
                        if (button && button.offsetParent !== null) {
                            searchButton = button;
                            break;
                        }
                    }
                }

                return { searchInput, searchButton };
            };

            const { searchInput, searchButton } = findSearchElements();

            if (!searchInput) {
                console.log('❌ No search input found');
                return { success: false, message: 'No search input found' };
            }

            // Fill and trigger input events
            searchInput.value = searchQuery;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            searchInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Try different submission methods
            if (searchButton) {
                console.log('🔍 Clicking search button');
                searchButton.click();
                return { success: true, message: 'Search button clicked' };
            }

            if (searchInput.form) {
                console.log('🔍 Submitting search form');
                searchInput.form.submit();
                return { success: true, message: 'Form submitted' };
            }

            // Last resort: simulate Enter key
            console.log('🔍 Simulating Enter key');
            searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            }));
            
            return { success: true, message: 'Enter key pressed' };
        };

        try {
            const result = await this.browserTab.executeScript(searchScript, [this.query]);
            console.log('🔍 Search result:', result?.[0]);
            
            // Wait for search results and take screenshot
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.browserTab.captureScreenshot();
            
            return result;
        } catch (error) {
            console.error('❌ Search error:', error);
            throw error;
        }
    }
}

export default SearchCommand;
