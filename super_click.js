// Super Click Functionality
// This script provides enhanced element finding capabilities

// Function to find and click any element on the page
function superClick(searchText) {
    console.log(`SuperClick looking for: "${searchText}"`);
    
    // Original element attributes to check
    const element = findElementByText(searchText);
    
    if (element) {
        console.log('Found element:', element);
        highlightAndClick(element);
        return { success: true, message: 'Element clicked' };
    } else {
        console.log('Element not found with primary search, trying alternatives...');
        
        // Try different variations
        let variations = [
            searchText.toLowerCase(),
            searchText.toUpperCase(),
            capitalize(searchText),
            searchText.trim()
        ];
        
        for (const variation of variations) {
            const element = findElementByText(variation);
            if (element) {
                console.log('Found element with variation:', variation, element);
                highlightAndClick(element);
                return { success: true, message: 'Element clicked with text variation' };
            }
        }
        
        // Try looking for partial matches
        const partialElement = findElementByPartialText(searchText);
        if (partialElement) {
            console.log('Found element with partial text:', partialElement);
            highlightAndClick(partialElement);
            return { success: true, message: 'Element clicked with partial text' };
        }
        
        // Try using querySelector with various selectors
        const selectors = [
            `[aria-label*="${searchText}"]`,
            `[title*="${searchText}"]`,
            `[data-testid*="${searchText}"]`,
            `[id*="${searchText}"]`,
            `[name*="${searchText}"]`,
            `[placeholder*="${searchText}"]`,
            `[alt*="${searchText}"]`
        ];
        
        for (const selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element) {
                    console.log('Found element with selector:', selector, element);
                    highlightAndClick(element);
                    return { success: true, message: 'Element clicked with selector' };
                }
            } catch (e) {
                // Continue if selector is invalid
            }
        }
        
        // Last resort: look for any links or buttons that might contain this text in their children
        const allButtons = document.querySelectorAll('button, a, [role="button"], .btn');
        for (const btn of allButtons) {
            if (btn.innerText && btn.innerText.includes(searchText)) {
                console.log('Found button with inner text:', btn);
                highlightAndClick(btn);
                return { success: true, message: 'Element clicked by inner text' };
            }
            
            // Check child text too
            const childText = Array.from(btn.querySelectorAll('*'))
                .some(child => child.innerText && child.innerText.includes(searchText));
                
            if (childText) {
                console.log('Found button with child text:', btn);
                highlightAndClick(btn);
                return { success: true, message: 'Element clicked by child text' };
            }
        }
        
        return { success: false, message: `Could not find element with text: ${searchText}` };
    }
}

// Find element by exact text match
function findElementByText(searchText) {
    // Look for buttons, links, and other clickable elements
    const elements = document.querySelectorAll(
        'button, a, [role="button"], input[type="submit"], input[type="button"], ' +
        'li, .nav-item, [data-testid], h1, h2, h3, h4, h5, h6, label, .card'
    );
    
    for (const el of elements) {
        const text = el.innerText || el.textContent || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        const title = el.getAttribute('title') || '';
        const alt = el.getAttribute('alt') || '';
        
        if (text.includes(searchText) || 
            ariaLabel.includes(searchText) || 
            title.includes(searchText) || 
            alt.includes(searchText)) {
            return el;
        }
    }
    
    return null;
}

// Find element by partial text match
function findElementByPartialText(searchText) {
    const searchLower = searchText.toLowerCase();
    
    // Look for buttons, links, and other clickable elements
    const elements = document.querySelectorAll(
        'button, a, [role="button"], input[type="submit"], input[type="button"], ' +
        'li, .nav-item, [data-testid], h1, h2, h3, h4, h5, h6, label, .card'
    );
    
    for (const el of elements) {
        const text = (el.innerText || el.textContent || '').toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const alt = (el.getAttribute('alt') || '').toLowerCase();
        
        if (text.includes(searchLower) || 
            ariaLabel.includes(searchLower) || 
            title.includes(searchLower) || 
            alt.includes(searchLower)) {
            return el;
        }
        
        // Check child nodes
        const children = el.querySelectorAll('*');
        for (const child of children) {
            const childText = (child.innerText || child.textContent || '').toLowerCase();
            if (childText.includes(searchLower)) {
                return el;
            }
        }
    }
    
    return null;
}

// Highlight and click an element
function highlightAndClick(element) {
    // Save original styles
    const originalOutline = element.style.outline;
    const originalBackground = element.style.backgroundColor;
    
    // Highlight the element
    element.style.outline = '2px solid red';
    element.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
    
    // Scroll element into view
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
    
    // Wait a moment, then click
    setTimeout(() => {
        // Click the element
        element.click();
        
        // Reset styles
        setTimeout(() => {
            element.style.outline = originalOutline;
            element.style.backgroundColor = originalBackground;
        }, 500);
    }, 500);
}

// Helper function to capitalize first letter
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Store the functions on window object so they can be used
window.SuperClick = {
    superClick: superClick,
    findElementByText: findElementByText,
    findElementByPartialText: findElementByPartialText
};
