import { chromium } from 'playwright';
import { VisionService } from './vision_service.js';

export class PlaywrightQAService {
    constructor() {
        this.browser = null;
        this.context = null;
        this.page = null;
        this.visionService = new VisionService();
    }

    async initialize() {
        try {
            console.log('🎭 Initializing Playwright...');
            this.browser = await chromium.launch({
                headless: false,
                args: ['--remote-debugging-port=9222']
            });
            this.context = await this.browser.newContext();
            this.page = await this.context.newPage();
            console.log('🎭 Playwright initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Playwright:', error);
            return false;
        }
    }

    async navigateTo(url) {
        try {
            console.log(`🎭 Navigating to ${url}`);
            await this.page.goto(url, { waitUntil: 'networkidle' });
            
            // Take screenshot for vision analysis
            const screenshot = await this.page.screenshot();
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

    async findAndClick(selector) {
        try {
            await this.page.click(selector);
            return true;
        } catch (error) {
            console.error('Click failed:', error);
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

    async analyzeCurrentPage() {
        try {
            const screenshot = await this.page.screenshot();
            const analysis = await this.visionService.analyzeScreenshot(
                screenshot.toString('base64')
            );
            return {
                success: true,
                analysis
            };
        } catch (error) {
            console.error('Page analysis failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
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