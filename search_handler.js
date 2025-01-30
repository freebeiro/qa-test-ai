// Enhanced search handler with improved Portuguese website support
export async function findAndExecuteSearch(searchQuery) {
    console.log('Starting search for:', searchQuery);
    
    // First attempt to find the search input
    let searchInput = findVisibleSearchInput();
    
    if (!searchInput) {
        console.log('No immediate search input found, looking for search icon...');
        const searchIcon = findSearchIcon();
        if (searchIcon) {
            console.log('Found search icon, clicking it...');
            searchIcon.click();
            await new Promise(resolve => setTimeout(resolve, 500));
            searchInput = findVisibleSearchInput();
        }
    }

    if (searchInput) {
        console.log('Found search input, proceeding with search...');
        return await executeSearchSequence(searchInput, searchQuery);
    }
    
    throw new Error('Could not find the search interface');
}

function findVisibleSearchInput() {
    // Enhanced selectors with Portuguese-specific patterns
    const searchSelectors = [
        // Continente specific selectors
        'input[placeholder="O que procura?"]',
        '[data-testid="search-input"]',
        '#search-input',
        // Generic Portuguese search inputs
        'input[placeholder*="procura" i]',
        'input[placeholder*="busca" i]',
        'input[placeholder*="pesquisa" i]',
        'input[aria-label*="procura" i]',
        'input[aria-label*="busca" i]',
        'input[aria-label*="pesquisa" i]',
        // Standard search inputs
        'input[type="search"]',
        'input[name*="search" i]',
        'input[name*="q" i]',
        // Role-based selectors
        '[role="searchbox"]',
        'input[role="search"]'
    ];

    for (const selector of searchSelectors) {
        const inputs = document.querySelectorAll(selector);
        for (const input of inputs) {
            if (isElementVisible(input)) {
                console.log(`Found search input with selector: ${selector}`);
                return input;
            }
        }
    }

    return null;
}

async function executeSearchSequence(searchInput, searchQuery) {
    try {
        // Focus and clear the input
        searchInput.focus();
        searchInput.value = '';
        
        // Set the search value and trigger events
        searchInput.value = searchQuery;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Force update for React/Angular apps
        searchInput.dispatchEvent(new Event('keyup', { bubbles: true }));
        
        // Wait briefly for any autocomplete to appear
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to find and click the search button
        const searchButton = findSearchButton(searchInput);
        if (searchButton) {
            console.log('Found search button, clicking it');
            searchButton.click();
            return { success: true, method: 'button_click' };
        }
        
        // If no button, try to submit the form
        const form = searchInput.closest('form');
        if (form) {
            console.log('Found search form, submitting it');
            form.submit();
            return { success: true, method: 'form_submit' };
        }
        
        // Last resort: simulate Enter key
        console.log('Simulating Enter key press');
        searchInput.dispatchEvent(new KeyboardEvent('keypress', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true
        }));
        
        return { success: true, method: 'enter_key' };
    } catch (error) {
        console.error('Error during search execution:', error);
        throw error;
    }
}

function findSearchButton(searchInput) {
    const buttonSelectors = [
        // Continente specific selectors
        'button[aria-label*="procurar"]',
        'button[aria-label*="pesquisar"]',
        // Generic search buttons
        'button[type="submit"]',
        'button.search-button',
        'button[aria-label*="search" i]',
        // Icon-based buttons
        'button .search-icon',
        'button[aria-label*="buscar" i]'
    ];

    // First try to find button within the same form
    const form = searchInput.closest('form');
    if (form) {
        for (const selector of buttonSelectors) {
            const button = form.querySelector(selector);
            if (button && isElementVisible(button)) {
                return button;
            }
        }
    }

    // Try to find button in the entire document
    for (const selector of buttonSelectors) {
        const button = document.querySelector(selector);
        if (button && isElementVisible(button)) {
            return button;
        }
    }

    return null;
}

function isElementVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return style.display !== 'none' &&
           style.visibility !== 'hidden' &&
           style.opacity !== '0' &&
           rect.width > 0 &&
           rect.height > 0 &&
           rect.top > 0;
}