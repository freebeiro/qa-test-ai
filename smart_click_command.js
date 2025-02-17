export class SmartClickCommand extends Command {
    constructor(intent, browserTab) {
        super();
        this.intent = intent;            // What we're trying to click
        this.browserTab = browserTab;    // Browser control
        this.visionService = new VisionService();
        console.log(`🎯 Creating SmartClickCommand for: "${intent}"`);
    }

    async execute() {
        try {
            console.log(`🔍 Finding element matching intent: "${this.intent}"`);
            
            // First, capture the current page state
            const screenshot = await this.browserTab.captureScreenshot();
            
            // Let the vision model find our target
            const elementMatch = await this.visionService.findElementByIntent(
                screenshot.replace(/^data:image\/[a-z]+;base64,/, ''),
                this.intent
            );

            if (!elementMatch) {
                throw new Error(`Could not find element matching: "${this.intent}"`);
            }

            console.log('🎯 Found matching element:', {
                description: elementMatch.description,
                confidence: elementMatch.confidence,
                location: elementMatch.location
            });

            // If we're very confident about the match
            if (elementMatch.confidence > 0.8) {
                const clickScript = (coords) => {
                    // Convert relative coordinates to pixel values
                    const x = Math.floor(coords.x * window.innerWidth);
                    const y = Math.floor(coords.y * window.innerHeight);
                    
                    // Find element at these coordinates
                    const element = document.elementFromPoint(x, y);
                    if (element) {
                        // Try multiple click methods
                        try {
                            element.click();
                            return true;
                        } catch (e) {
                            // If direct click fails, try creating a click event
                            const clickEvent = new MouseEvent('click', {
                                view: window,
                                bubbles: true,
                                cancelable: true,
                                clientX: x,
                                clientY: y
                            });
                            element.dispatchEvent(clickEvent);
                            return true;
                        }
                    }
                    return false;
                };

                // Execute the click
                const result = await this.browserTab.executeScript(
                    clickScript,
                    [elementMatch.location]
                );

                // Verify the click worked
                if (result && result[0]) {
                    console.log('✅ Successfully clicked element');
                    
                    // Take a screenshot of the result
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await this.browserTab.captureScreenshot();
                    
                    return true;
                }
            }

            // If vision-guided click failed, fall back to traditional methods
            console.log('⚠️ Vision-guided click failed, trying fallback methods...');
            return await this.fallbackClick();

        } catch (error) {
            console.error('❌ Smart click failed:', error);
            throw error;
        }
    }

    async fallbackClick() {
        // Try traditional methods of finding and clicking elements
        const traditionalClickScript = (intentText) => {
            // Various strategies to find the element
            const strategies = [
                // By text content
                () => Array.from(document.querySelectorAll('*')).find(
                    el => el.textContent?.toLowerCase().includes(intentText.toLowerCase())
                ),
                // By aria-label
                () => document.querySelector(`[aria-label*="${intentText}" i]`),
                // By title
                () => document.querySelector(`[title*="${intentText}" i]`),
                // By placeholder
                () => document.querySelector(`[placeholder*="${intentText}" i]`),
                // By button text
                () => Array.from(document.querySelectorAll('button')).find(
                    btn => btn.textContent?.toLowerCase().includes(intentText.toLowerCase())
                )
            ];

            // Try each strategy
            for (const strategy of strategies) {
                const element = strategy();
                if (element) {
                    element.click();
                    return true;
                }
            }
            
            return false;
        };

        const result = await this.browserTab.executeScript(
            traditionalClickScript,
            [this.intent]
        );

        return result && result[0];
    }
}