import { VisionService } from './vision_service.js';
import { Command } from './commands.js';

// Base class for vision-enhanced commands
export class VisionEnhancedCommand extends Command {
    constructor(browserTab) {
        super();
        this.browserTab = browserTab;
        this.visionService = new VisionService();
    }
}

// Command for testing vision capabilities
export class TestVisionCommand extends VisionEnhancedCommand {
    constructor(browserTab) {
        super(browserTab);
        console.log('🔍 Creating TestVisionCommand');
    }

    async execute() {
        try {
            console.log('📸 Capturing screenshot for vision test...');
            const screenshot = await this.browserTab.captureScreenshot();
            const base64Image = screenshot.replace(/^data:image\/\w+;base64,/, '');

            console.log('🔍 Running vision analysis...');
            const analysis = await this.visionService.analyzeScreenshot(base64Image);
            console.log('📊 Vision analysis results:', analysis);

            return {
                success: true,
                message: 'Vision analysis completed',
                screenshots: [{
                    data: screenshot,
                    caption: 'Analyzed Page'
                }],
                analysis: this.formatResults(analysis)
            };
        } catch (error) {
            console.error('❌ Vision test failed:', error);
            throw error;
        }
    }

    formatResults(analysis) {
        let formatted = 'Vision Analysis Results:\n\n';

        if (analysis.elements?.length > 0) {
            formatted += '📍 Interactive Elements Found:\n';
            analysis.elements.forEach(el => {
                formatted += `• ${el.type}: ${el.description}\n`;
            });
            formatted += '\n';
        }

        if (analysis.suggestions?.length > 0) {
            formatted += '💡 Suggested Actions:\n';
            analysis.suggestions.forEach(suggestion => {
                formatted += `• ${suggestion}\n`;
            });
            formatted += '\n';
        }

        if (analysis.text) {
            formatted += '📝 Detailed Analysis:\n';
            formatted += analysis.text;
        }

        return formatted;
    }
}

// Command for locating elements using vision and text analysis
export class LocateCommand extends VisionEnhancedCommand {
    constructor(browserTab, params) {
        super(browserTab);
        this.text = params.text;
        this.section = params.section;
        this.itemIndex = params.itemIndex;
        console.log('🔍 Creating LocateCommand:', params);
    }

    async execute() {
        try {
            console.log('🔍 Locating element...');
            
            // First try direct DOM search
            const elementFound = await this.browserTab.executeScript(
                (data) => {
                    return new Promise((resolve) => {
                        chrome.runtime.sendMessage({
                            type: 'LOCATE_ELEMENT',
                            data
                        }, resolve);
                    });
                },
                [{
                    text: this.text,
                    section: this.section,
                    itemIndex: this.itemIndex
                }]
            );

            if (elementFound.success) {
                console.log('✅ Element found through DOM:', elementFound.element);
                
                // Capture screenshot with highlight
                const screenshot = await this.browserTab.captureScreenshot();
                
                // Hide highlight after screenshot
                await this.browserTab.executeScript(() => {
                    return new Promise((resolve) => {
                        chrome.runtime.sendMessage({
                            type: 'HIDE_HIGHLIGHT'
                        }, resolve);
                    });
                });

                return {
                    success: true,
                    message: 'Element located successfully',
                    element: elementFound.element,
                    screenshots: [{
                        data: screenshot,
                        caption: `Located element: ${elementFound.element.text}`
                    }]
                };
            }

            // If DOM search fails, try vision-based search
            console.log('🔍 Trying vision-based search...');
            const screenshot = await this.browserTab.captureScreenshot();
            const base64Image = screenshot.replace(/^data:image\/\w+;base64,/, '');

            let prompt = '';
            if (this.section && this.itemIndex) {
                prompt = `Find the ${this.itemIndex}th item in the "${this.section}" section`;
            } else if (this.section) {
                prompt = `Find the section labeled "${this.section}"`;
            } else {
                prompt = `Find the element with text "${this.text}"`;
            }

            const elementInfo = await this.visionService.findElementByIntent(base64Image, prompt);
            
            if (elementInfo && elementInfo.confidence > 0.7) {
                console.log('✅ Element found through vision:', elementInfo);
                
                // Try to highlight the element using coordinates
                await this.browserTab.executeScript(
                    (coords) => {
                        const element = document.elementFromPoint(
                            coords.x * window.innerWidth,
                            coords.y * window.innerHeight
                        );
                        if (element) {
                            return new Promise((resolve) => {
                                chrome.runtime.sendMessage({
                                    type: 'LOCATE_ELEMENT',
                                    data: { element }
                                }, resolve);
                            });
                        }
                    },
                    [elementInfo.location]
                );

                // Capture screenshot with highlight
                const highlightedScreenshot = await this.browserTab.captureScreenshot();
                
                // Hide highlight
                await this.browserTab.executeScript(() => {
                    return new Promise((resolve) => {
                        chrome.runtime.sendMessage({
                            type: 'HIDE_HIGHLIGHT'
                        }, resolve);
                    });
                });

                return {
                    success: true,
                    message: 'Element located through vision analysis',
                    element: elementInfo,
                    screenshots: [{
                        data: highlightedScreenshot,
                        caption: `Located element: ${elementInfo.description}`
                    }]
                };
            }

            throw new Error('Element not found');
        } catch (error) {
            console.error('❌ Element location failed:', error);
            throw error;
        }
    }
}