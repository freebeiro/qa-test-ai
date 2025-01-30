class ElementFinder {
    constructor() {
        // Our existing search input selectors
        this.searchSelectors = {
            // Previous selectors remain...
        };

        // New selectors specifically for search icons and triggers
        this.searchIconSelectors = [
            // Icon buttons
            'button svg[aria-label*="search" i]',
            'button i[class*="search" i]',
            'button[aria-label*="search" i]',
            
            // Common icon class patterns
            '.fa-search',
            '.search-icon',
            '.icon-search',
            '.magnifying-glass',
            
            // Icon buttons with Portuguese labels
            'button[aria-label*="pesquisa" i]',
            'button[aria-label*="buscar" i]',
            
            // Icon containers
            '[role="search"] button',
            'header [aria-label*="search" i]'
        ];
    }

    async findSearchInterface(document) {
        // First, try to find a visible search input
        const visibleSearch = await this.findVisibleSearchElements(document);
        if (visibleSearch.input) {
            console.log('Found visible search interface');
            return visibleSearch;
        }

        // If no visible search, look for search icons
        console.log('No visible search found, looking for search icons...');
        const searchIcon = await this.findAndHandleSearchIcon(document);
        
        // After clicking icon, wait for search input to appear
        if (searchIcon) {
            console.log('Found and clicked search icon, waiting for input to appear...');
            return await this.waitForSearchInput(document);
        }

        return null;
    }

    async findAndHandleSearchIcon(document) {
        for (const selector of this.searchIconSelectors) {
            // Find potential search icons
            const iconElement = document.querySelector(selector);
            
            if (iconElement) {
                console.log(`Found potential search icon using selector: ${selector}`);
                
                // Check if the icon is actually visible
                const isVisible = await this.isElementVisible(iconElement);
                if (!isVisible) {
                    console.log('Icon found but not visible, continuing search...');
                    continue;
                }

                // Interact with the icon to reveal search
                try {
                    // Store the current DOM state
                    const beforeClick = document.body.innerHTML;
                    
                    // Click the icon
                    iconElement.click();
                    
                    // Wait briefly for any animations
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if DOM changed after click
                    const afterClick = document.body.innerHTML;
                    if (beforeClick !== afterClick) {
                        console.log('Search icon interaction caused DOM change');
                        return true;
                    }
                } catch (error) {
                    console.log('Error interacting with search icon:', error);
                }
            }
        }
        
        return false;
    }

    async waitForSearchInput(document, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Wait for potential animations
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Look for newly visible search inputs
            const searchElements = await this.findVisibleSearchElements(document);
            if (searchElements.input) {
                console.log('Found search input after icon interaction');
                return searchElements;
            }
        }
        
        console.log('No search input found after icon interaction');
        return null;
    }

    async isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               rect.width > 0 &&
               rect.height > 0;
    }

    async findVisibleSearchElements(document) {
        const elements = {
            input: null,
            button: null,
            form: null
        };

        // Check each potential search input
        for (const [category, selectors] of Object.entries(this.searchSelectors)) {
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && await this.isElementVisible(element)) {
                    elements.input = element;
                    elements.form = element.closest('form');
                    elements.button = this.findSearchButton(document, element);
                    return elements;
                }
            }
        }

        return elements;
    }

    handleSearchInput(searchElements, searchQuery) {
        const {input, button, form} = searchElements;
        
        // Focus the input field
        input.focus();
        
        // Set the input value
        input.value = searchQuery;
        
        // Trigger necessary events
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // If we have a button, click it
        if (button) {
            button.click();
        }
        // Otherwise, submit the form if available
        else if (form) {
            form.submit();
        }
        // Last resort: simulate Enter key
        else {
            input.dispatchEvent(new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                bubbles: true
            }));
        }
    }
}

export default ElementFinder;