import './styles/highlight.css';

// Highlight Manager Class
class HighlightManager {
    constructor() {
        console.log('🎨 HighlightManager initialized');
        this.highlights = [];
        this.isEnabled = false;
        
        // Listen for messages from the chat window
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('🎨 Received message:', message);  // Debug log
            if (message.type === 'TOGGLE_HIGHLIGHTS') {
                this.toggleHighlight();
                sendResponse({ success: true });
            }
        });
    }

    init() {
        console.log('🎨 Initializing HighlightManager');
        // Don't enable highlights by default anymore
        // this.toggleHighlight(); <- Remove this line
    }

    toggleHighlight() {
        if (this.isEnabled) {
            // If highlights are enabled, remove them
            this.removeHighlights();
            this.isEnabled = false;
        } else {
            // If highlights are disabled, show them
            this.highlightInteractiveElements();
            this.isEnabled = true;
        }
        console.log('🎨 Highlight state:', this.isEnabled);
    }

    highlightInteractiveElements() {
        console.log('🎨 Adding highlights to elements');
        const interactiveElements = document.querySelectorAll(`
            button,
            a[href],
            input[type="submit"],
            input[type="button"],
            [role="button"],
            select,
            [class*="button"],
            [class*="btn"],
            [onclick],
            [class*="carrinho"],
            [class*="cart"],
            [class*="product"],
            [class*="produto"],
            .product-card,
            .produto-card,
            [data-testid*="product"],
            [data-testid*="produto"]
        `);

        // Remove any existing highlights
        this.removeHighlights();

        interactiveElements.forEach(element => {
            // Skip if element is not visible
            if (!this.isElementVisible(element)) return;

            // Skip if element is too small
            const rect = element.getBoundingClientRect();
            if (rect.width < 10 || rect.height < 10) return;

            const wrapper = document.createElement('div');
            wrapper.classList.add('highlight-wrapper');

            const highlight = document.createElement('div');
            highlight.classList.add('interactive-highlight');

            const elementType = this.getElementType(element);
            const typeClass = `type-${elementType}`;
            highlight.classList.add(typeClass);
            
            const label = document.createElement('div');
            label.classList.add('highlight-label', typeClass);
            
            const elementInfo = this.getElementInfo(element);
            label.textContent = `${elementType}: ${elementInfo.label}`;

            wrapper.style.position = 'absolute';
            wrapper.style.top = `${rect.top + window.scrollY}px`;
            wrapper.style.left = `${rect.left + window.scrollX}px`;
            wrapper.style.width = `${rect.width}px`;
            wrapper.style.height = `${rect.height}px`;

            wrapper.appendChild(highlight);
            wrapper.appendChild(label);
            document.body.appendChild(wrapper);
            this.highlights.push(wrapper);
        });

        // Add listeners for page changes
        window.addEventListener('resize', () => this.updateAllHighlights());
        window.addEventListener('scroll', () => this.updateAllHighlights());
    }

    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 &&
               element.offsetHeight > 0;
    }

    getElementInfo(element) {
        let label = '';
        let details = [];

        // Get text content
        const text = element.textContent.trim();
        
        // Get element type
        const type = element.tagName.toLowerCase();
        
        // Get relevant attributes
        const role = element.getAttribute('role');
        const id = element.getAttribute('id');
        const classes = element.getAttribute('class');
        const href = element.getAttribute('href');

        // Build label
        if (text) {
            label = text.substring(0, 20) + (text.length > 20 ? '...' : '');
        } else if (element.getAttribute('aria-label')) {
            label = element.getAttribute('aria-label');
        } else if (element.getAttribute('title')) {
            label = element.getAttribute('title');
        } else if (element.getAttribute('alt')) {
            label = element.getAttribute('alt');
        } else {
            label = `${type}${id ? '#' + id : ''}`;
        }

        // Build details
        details.push(`Type: ${type}`);
        if (role) details.push(`Role: ${role}`);
        if (href) details.push(`Link: ${href}`);
        if (id) details.push(`ID: ${id}`);
        if (classes) details.push(`Classes: ${classes}`);

        return {
            label,
            details: details.join('\n')
        };
    }

    getElementType(element) {
        // Check for product elements first
        if (element.matches('[class*="product"], [class*="produto"], .product-card, .produto-card, [data-testid*="product"]')) {
            return 'product';
        }

        // Check for cart/carrinho buttons
        if (element.matches('[class*="carrinho"], [class*="cart"]')) {
            return 'cart';
        }

        // Debug log
        console.log('Determining type for:', element);

        if (element.tagName.toLowerCase() === 'a') {
            return 'link';
        }
        
        if (element.tagName.toLowerCase() === 'button' || 
            element.getAttribute('role') === 'button' ||
            (element.tagName.toLowerCase() === 'input' && 
             ['submit', 'button'].includes(element.type))) {
            return 'button';
        }
        
        if (element.tagName.toLowerCase() === 'input') {
            if (element.type === 'search' || element.getAttribute('role') === 'search') {
                return 'search';
            }
            return 'input';
        }
        
        if (element.tagName.toLowerCase() === 'select') {
            return 'select';
        }
        
        if (element.getAttribute('role') === 'menuitem' || 
            element.parentElement?.getAttribute('role') === 'menu') {
            return 'menu';
        }

        // Debug log
        console.log('Defaulting to button for:', element);
        return 'button';
    }

    getColorForType(type) {
        const colors = {
            'button': '#2196F3',
            'link': '#4CAF50',
            'input': '#9C27B0',
            'select': '#FF9800',
            'search': '#FF5722',
            'menu': '#673AB7',
            'form': '#009688'
        };
        return colors[type] || '#2196F3'; // Default to blue if type not found
    }

    updateAllHighlights() {
        const elements = document.querySelectorAll(
            'button, a[href], input[type="submit"], input[type="button"], [role="button"]'
        );
        elements.forEach((element, index) => {
            if (this.highlights[index]) {
                const rect = element.getBoundingClientRect();
                const highlight = this.highlights[index];
                highlight.style.top = `${rect.top + window.scrollY}px`;
                highlight.style.left = `${rect.left + window.scrollX}px`;
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
            }
        });
    }

    removeHighlights() {
        console.log('🎨 Removing highlights');
        this.highlights.forEach(highlight => highlight.remove());
        this.highlights = [];
    }
}

// Initialize but don't show highlights yet
console.log('🎨 Content script loaded');
const highlightManager = new HighlightManager();
highlightManager.init();

// Export for webpack
export { HighlightManager }; 