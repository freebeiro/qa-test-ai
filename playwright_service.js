import { chromium } from 'playwright';
import VisionService from './vision_service.js';

class PlaywrightService {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.visionService = new VisionService();
    }

    async initialize() {
        try {
            this.browser = await chromium.launch({
                headless: false
            });
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
            await this.setupPageHandlers();
            console.log('🎭 Playwright initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Playwright:', error);
            throw error;
        }
    }

    async setupPageHandlers() {
        // Set up error handling
        this.page.on('pageerror', error => {
            console.error('Page error:', error);
        });

        // Set up console logging
        this.page.on('console', msg => {
            console.log('Browser console:', msg.text());
        });
    }

    async navigateTo(url) {
        try {
            await this.page.goto(url, {
                waitUntil: 'networkidle'
            });
            
            // Take screenshot for vision analysis
            const screenshot = await this.page.screenshot({
                type: 'jpeg',
                quality: 80,
                fullPage: true
            });
            
            // Analyze the page using vision model
            const analysis = await this.visionService.analyzeScreenshot(
                screenshot.toString('base64')
            );
            
            return {
                success: true,
                analysis
            };
        } catch (error) {
            console.error('Navigation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async findAndClick(selector, options = {}) {
        try {
            // First try standard Playwright selector
            let element = await this.page.$(selector);
            
            if (!element && options.text) {
                // Try finding by text if selector fails
                element = await this.visionService.findElementByText(this.page, options.text);
            }
            
            if (!element && options.visualDescription) {
                // Try finding by visual location/description
                element = await this.visionService.findElementByVisualLocation(
                    this.page,
                    options.visualDescription
                );
            }
            
            if (element) {
                await element.click();
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Click operation failed:', error);
            return false;
        }
    }

    async fillForm(selector, value) {
        try {
            await this.page.fill(selector, value);
            return true;
        } catch (error) {
            console.error('Form fill failed:', error);
            return false;
        }
    }

    async waitForNavigation() {
        try {
            await this.page.waitForLoadState('networkidle');
            return true;
        } catch (error) {
            console.error('Navigation wait failed:', error);
            return false;
        }
    }

    async getPageState() {
        return {
            url: this.page.url(),
            title: await this.page.title(),
            screenshot: await this.page.screenshot({
                type: 'jpeg',
                quality: 80
            })
        };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.context = null;
            this.page = null;
        }
    }
}

export default PlaywrightService; 