import { VisionService } from './vision_service.js';
import { Command } from './commands.js';

// Smart click command that uses vision to understand and click elements
export class SmartClickCommand extends Command {
    constructor(target, browserTab) {
        super();
        this.target = target;
        this.browserTab = browserTab;
        this.visionService = new VisionService();
        console.log(`🎯 Creating SmartClickCommand for: "${target}"`);
    }

    async execute() {
        try {
            console.log(`🔍 Looking for element: "${this.target}"`);
            
            // First, understand the page
            const screenshot = await this.browserTab.captureScreenshot();
            const elementMatch = await this.visionService.findElementByIntent(
                screenshot.replace(/^data:image\/[a-z]+;base64,/, ''),
                this.target
            );

            if (!elementMatch) {
                throw new Error(`Could not find element matching: "${this.target}"`);
            }

            console.log('🎯 Found matching element:', {
                description: elementMatch.description,
                confidence: elementMatch.confidence,
                location: elementMatch.location
            });

            // Click with high precision if we're confident
            if (elementMatch.confidence > 0.8) {
                const result = await this.clickWithVisionGuidance(elementMatch);
                if (result) {
                    console.log('✅ Successfully clicked element');
                    return true;
                }
            }

            // Fall back to traditional clicking if vision guidance fails
            console.log('⚠️ Trying traditional click methods...');
            return await this.fallbackClick();

        } catch (error) {
            console.error('❌ Smart click failed:', error);
            throw error;
        }
    }

    async clickWithVisionGuidance(elementMatch) {
        const clickScript = (coords) => {
            // Convert relative coordinates to pixels
            const x = Math.floor(coords.x * window.innerWidth);
            const y = Math.floor(coords.y * window.innerHeight);
            
            // Find and click element
            const element = document.elementFromPoint(x, y);
            if (element) {
                try {
                    // Try multiple click methods
                    element.click();
                    return true;
                } catch (e) {
                    try {
                        // Create and dispatch click event
                        const clickEvent = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                            clientX: x,
                            clientY: y
                        });
                        element.dispatchEvent(clickEvent);
                        return true;
                    } catch (error) {
                        console.error('Click simulation failed:', error);
                        return false;
                    }
                }
            }
            return false;
        };

        const result = await this.browserTab.executeScript(
            clickScript,
            [elementMatch.location]
        );

        if (result && result[0]) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.browserTab.captureScreenshot();
            return true;
        }

        return false;
    }

    async fallbackClick() {
        const traditionalClickScript = (target) => {
            // Multiple strategies to find the element
            const strategies = [
                // By text content
                () => Array.from(document.querySelectorAll('*')).find(
                    el => el.textContent?.toLowerCase().includes(target.toLowerCase())
                ),
                // By various attributes
                () => document.querySelector(`[aria-label*="${target}" i]`),
                () => document.querySelector(`[title*="${target}" i]`),
                () => document.querySelector(`[placeholder*="${target}" i]`),
                // By button text
                () => Array.from(document.querySelectorAll('button')).find(
                    btn => btn.textContent?.toLowerCase().includes(target.toLowerCase())
                )
            ];

            // Try each strategy
            for (const strategy of strategies) {
                try {
                    const element = strategy();
                    if (element) {
                        element.click();
                        return true;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            return false;
        };

        const result = await this.browserTab.executeScript(
            traditionalClickScript,
            [this.target]
        );

        return result && result[0];
    }
}