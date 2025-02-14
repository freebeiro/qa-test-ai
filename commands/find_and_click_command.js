import Command from '../core/command.js';

class FindAndClickCommand extends Command {
    constructor(text, browserTab) {
        super();
        this.text = text;
        this.browserTab = browserTab;
        console.log('🖱️ Creating FindAndClickCommand:', text);
    }

    async execute() {
        console.log('🖱️ Executing find and click command:', this.text);
        try {
            const result = await this.browserTab.executeScript((searchText) => {
                // Helper function to check if element is visible
                const isVisible = (elem) => {
                    if (!elem) return false;
                    const style = window.getComputedStyle(elem);
                    return style.display !== 'none' && 
                           style.visibility !== 'hidden' && 
                           style.opacity !== '0';
                };

                // Helper function to get element text
                const getElementText = (elem) => {
                    return (elem.innerText || elem.textContent || '').trim().toLowerCase();
                };

                // Find all clickable elements
                const clickableElements = [...document.querySelectorAll(
                    'a, button, [role="button"], input[type="submit"], [onclick], [class*="btn"], [class*="button"]'
                )].filter(isVisible);

                // First try exact text match
                let element = clickableElements.find(el => 
                    getElementText(el) === searchText.toLowerCase()
                );

                // If no exact match, try contains
                if (!element) {
                    element = clickableElements.find(el => 
                        getElementText(el).includes(searchText.toLowerCase())
                    );
                }

                if (element) {
                    // Scroll into view first
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Wait a bit for scroll to complete
                    setTimeout(() => {
                        // Try click() first
                        try {
                            element.click();
                        } catch (e) {
                            // Fallback to creating and dispatching click event
                            const event = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true
                            });
                            element.dispatchEvent(event);
                        }
                    }, 300);
                    
                    return true;
                }

                return false;
            }, [this.text]);

            // Wait for any navigation that might happen after click
            await new Promise(resolve => setTimeout(resolve, 1000));

            return result;
        } catch (error) {
            console.error('❌ Find and click command failed:', error);
            throw error;
        }
    }
}

export default FindAndClickCommand;