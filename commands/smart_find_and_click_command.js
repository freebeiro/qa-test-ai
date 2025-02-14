import Command from '../core/command.js';

class SmartFindAndClickCommand extends Command {
    constructor(options, browserTab) {
        super();
        this.options = options; // { text, index, price, priceRange }
        this.browserTab = browserTab;
        console.log(`🔍 Creating SmartFindAndClickCommand with options:`, options);
    }

    async execute() {
        const findAndClickScript = (options) => {
            console.log(`🔍 Running smart find and click script with options:`, options);
            
            // Helper function to check if element is visible
            const isVisible = (element) => {
                const rect = element.getBoundingClientRect();
                const style = window.getComputedStyle(element);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       rect.width > 0 &&
                       rect.height > 0;
            };

            // Helper to extract price from text
            const extractPrice = (text) => {
                const priceMatch = text.match(/[0-9]+[.,][0-9]+/);
                return priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : null;
            };

            // Helper to get product information
            const getProductInfo = (element) => {
                const text = element.textContent.toLowerCase();
                const priceElement = element.querySelector('[class*="price"], [class*="valor"], .price, .valor');
                const price = priceElement ? extractPrice(priceElement.textContent) : null;
                
                return {
                    element,
                    text,
                    price,
                    visible: isVisible(element)
                };
            };

            // Find all product-like containers
            const findProducts = () => {
                const productSelectors = [
                    '[class*="product"]',
                    '[class*="item"]',
                    'article',
                    '.product',
                    '.item',
                    'li'
                ];
                
                const products = [];
                productSelectors.forEach(selector => {
                    document.querySelectorAll(selector).forEach(element => {
                        products.push(getProductInfo(element));
                    });
                });
                
                return [...new Set(products)];
            };

            // Smart matching function
            const matchesProduct = (product, options) => {
                if (!product.visible) return false;

                // Text matching
                if (options.text) {
                    const searchTerms = options.text.toLowerCase().split(' ');
                    if (!searchTerms.every(term => product.text.includes(term))) {
                        return false;
                    }
                }

                // Price matching
                if (options.price && product.price !== options.price) {
                    return false;
                }

                // Price range matching
                if (options.priceRange) {
                    if (!product.price || 
                        product.price < options.priceRange.min || 
                        product.price > options.priceRange.max) {
                        return false;
                    }
                }

                return true;
            };

            // Find matching products
            const products = findProducts();
            console.log(`📦 Found ${products.length} potential products`);
            
            const matches = products.filter(product => matchesProduct(product, options));
            console.log(`✨ Found ${matches.length} matching products`);

            if (matches.length === 0) {
                console.log('❌ No matching products found');
                return { success: false, message: 'No matching products found' };
            }

            // Handle index selection
            let selectedProduct;
            if (typeof options.index === 'number') {
                selectedProduct = matches[options.index];
            } else if (options.index === 'last') {
                selectedProduct = matches[matches.length - 1];
            } else {
                selectedProduct = matches[0];
            }

            if (!selectedProduct) {
                return { success: false, message: 'Selected product index out of range' };
            }

            // Scroll product into view if needed
            selectedProduct.element.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Click the product
            try {
                selectedProduct.element.click();
                return { success: true, message: 'Product clicked successfully' };
            } catch (error) {
                console.error('Click failed:', error);
                return { success: false, message: 'Failed to click product' };
            }
        };

        try {
            const result = await this.browserTab.executeScript(findAndClickScript, [this.options]);
            if (!result?.[0]?.success) {
                throw new Error(result?.[0]?.message || 'Failed to find or click product');
            }
            return result;
        } catch (error) {
            console.error('❌ SmartFindAndClick error:', error);
            throw error;
        }
    }
}

export default SmartFindAndClickCommand;
