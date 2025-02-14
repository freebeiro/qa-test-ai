class ScreenshotService {
    constructor(browserTabManager) {
        this.browserTab = browserTabManager;
    }

    async captureScreenshot(caption = '') {
        try {
            // Wait for any animations/transitions to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            const screenshotData = await this.browserTab.captureScreenshot();
            
            return {
                data: screenshotData,
                caption,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Screenshot capture failed:', error);
            throw error;
        }
    }

    async captureElement(selector) {
        try {
            await this.browserTab.scrollIntoView(selector);
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const screenshot = await this.browserTab.captureScreenshot();
            return {
                data: screenshot,
                caption: `Element: ${selector}`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Element screenshot failed:', error);
            throw error;
        }
    }
}

export default ScreenshotService;