import { UrlHelper } from './url_helper.js';

export class BrowserTabManager {
    constructor() {
        this.tabId = null;
        this.windowId = null;
        this.port = null;
        this.initializeConnection();
        console.log('🔧 Initializing BrowserTabManager');
    }

    initializeConnection() {
        this.port = chrome.runtime.connect({ name: "qa-window" });
        
        this.port.onMessage.addListener(async (message) => {
            if (message.type === 'INIT_STATE') {
                this.tabId = message.browserTabId;
                try {
                    const tab = await chrome.tabs.get(this.tabId);
                    this.windowId = tab.windowId;
                    console.log(`🔧 Initialized with browser tab ID: ${this.tabId}`);
                    
                    // Check if we're in a valid context
                    if (this.isInternalUrl(tab.url)) {
                        await this.createNewTab();
                    } else {
                        await this.ensureTabActive();
                    }
                } catch (error) {
                    console.error('Failed to get window ID:', error);
                    await this.createNewTab();
                }
            }
        });
    }

    isInternalUrl(url) {
        console.log(`Browser Manager checking URL: ${url}`);
        const result = UrlHelper.isInternalUrl(url);
        console.log(`Is internal URL? ${result}`);
        return result;
    }

    async createNewTab() {
        try {
            console.log('Creating new browser tab...');
            const tab = await chrome.windows.create({ 
                url: 'about:blank',
                type: 'normal',  // Changed to normal for better compatibility
                width: 1024,
                height: 768,
                focused: true
            });
            this.tabId = tab.tabs[0].id;
            this.windowId = tab.id;
            console.log(`Created new window with ID: ${this.windowId} and tab ID: ${this.tabId}`);
            
            await chrome.storage.local.set({ browserTabId: this.tabId });
            return tab;
        } catch (error) {
            console.error('Failed to create new window:', error);
            throw error;
        }
    }

    async navigate(url) {
        console.log(`Navigation requested to: ${url}`);
        try {
            console.log('Ensuring tab is active before navigation');
            await this.ensureTabActive();
            console.log('Tab activation complete');
            
            // Process the URL
            let processedUrl = UrlHelper.normalizeUrl(url);
            console.log(`Normalized URL: ${processedUrl}`);
            
            if (!UrlHelper.isValidExternalUrl(processedUrl)) {
                console.error(`Invalid URL detected: ${processedUrl}`);
                throw new Error('Invalid or unsupported URL format');
            }
            
            console.log(`Navigating to: ${processedUrl}`);
            
            // Update the tab
            const tab = await chrome.tabs.update(this.tabId, { url: processedUrl });
            
            // Wait for navigation to complete
            await new Promise((resolve) => {
                const listener = (tabId, changeInfo) => {
                    if (tabId === this.tabId && changeInfo.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                };
                chrome.tabs.onUpdated.addListener(listener);
                
                // Timeout after 30 seconds
                setTimeout(() => {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }, 30000);
            });
            
            // Additional delay to ensure page is fully loaded
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Re-inject cursor after navigation
            await chrome.runtime.sendMessage({ 
                type: 'EXECUTE_COMMAND',
                command: { type: 'ensure_cursor' }
            });
            
            return tab;
        } catch (error) {
            console.error('Navigation failed:', error);
            throw error;
        }
    }

    async ensureTabActive() {
        console.log('Ensuring tab is active with tabId:', this.tabId, 'windowId:', this.windowId);
        
        if (!this.tabId || !this.windowId) {
            console.log('No active tab, creating new one...');
            await this.createNewTab();
            return;
        }
        
        try {
            // Check if the current tab is valid
            const tab = await chrome.tabs.get(this.tabId);
            console.log(`Current tab URL: ${tab.url}`);
            
            if (this.isInternalUrl(tab.url)) {
                console.log('Current tab is internal, creating new one...');
                await this.createNewTab();
                return;
            } else {
                console.log('Current tab is valid external URL');
            }
            
            await chrome.windows.update(this.windowId, { focused: true });
            await chrome.tabs.update(this.tabId, { active: true });
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Failed to activate tab:', error);
            await this.createNewTab();
        }
    }

    async captureScreenshot() {
        try {
            await this.ensureTabActive();
            
            // Verify window focus and tab state
            const tab = await chrome.tabs.get(this.tabId);
            if (this.isInternalUrl(tab.url)) {
                console.log('Cannot capture screenshot of internal page');
                return null;
            }

            // Ensure window is focused
            await chrome.windows.update(this.windowId, { focused: true });
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for focus

            // Implement exponential backoff retry
            const maxRetries = 3;
            const baseDelay = 1000; // 1 second
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    const result = await chrome.tabs.captureVisibleTab(this.windowId, {
                        format: 'png',
                        quality: 100
                    });
                    
                    if (result) {
                        return result;
                    }
                } catch (error) {
                    if (error.message.includes('MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND')) {
                        const delay = baseDelay * Math.pow(2, attempt);
                        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue;
                    }
                    throw error; // Rethrow other errors
                }
            }
            
            console.error('❌ Screenshot capture failed after max retries');
            return null;
        } catch (error) {
            console.error('❌ Screenshot capture failed:', error);
            return null;
        }
    }

    async executeScript(func, args = []) {
        await this.ensureTabActive();
        try {
            const results = await chrome.scripting.executeScript({
                target: { tabId: this.tabId },
                function: func,
                args: args
            });
            return results[0]?.result;
        } catch (error) {
            console.error('❌ Script execution failed:', error);
            throw error;
        }
    }
}