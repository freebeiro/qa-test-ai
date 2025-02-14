import Command from '../core/command.js';

class ScrollCommand extends Command {
    constructor(direction, browserTab) {
        super();
        this.direction = direction;
        this.browserTab = browserTab;
        console.log('⬆️⬇️ Creating ScrollCommand:', direction);
    }

    async execute() {
        console.log('⬆️⬇️ Executing scroll command:', this.direction);
        try {
            const result = await this.browserTab.executeScript((direction) => {
                const scrollOptions = { behavior: 'smooth' };
                
                switch (direction.toLowerCase()) {
                    case 'up':
                        window.scrollBy({ top: -300, ...scrollOptions });
                        break;
                    case 'down':
                        window.scrollBy({ top: 300, ...scrollOptions });
                        break;
                    case 'top':
                        window.scrollTo({ top: 0, ...scrollOptions });
                        break;
                    case 'bottom':
                        window.scrollTo({ 
                            top: document.documentElement.scrollHeight,
                            ...scrollOptions
                        });
                        break;
                }
                return true;
            }, [this.direction]);

            // Wait for scroll animation
            await new Promise(resolve => setTimeout(resolve, 500));

            return result;
        } catch (error) {
            console.error('❌ Scroll command failed:', error);
            throw error;
        }
    }
}

export default ScrollCommand;