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
        if (!url) return true;
        return url.startsWith('chrome://') || 
               url.startsWith('chrome-extension://') || 
               url.startsWith('brave://') ||
               url.startsWith('devtools://');
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
        try {
            await this.ensureTabActive();
            
            // Process the URL
            let processedUrl = url.toLowerCase().trim();
            if (!processedUrl.match(/^https?:\/\//)) {
                processedUrl = `https://${processedUrl}`;
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
        if (!this.tabId || !this.windowId) {
            console.log('No active tab, creating new one...');
            await this.createNewTab();
            return;
        }
        
        try {
            // Check if the current tab is valid
            const tab = await chrome.tabs.get(this.tabId);
            if (this.isInternalUrl(tab.url)) {
                console.log('Current tab is internal, creating new one...');
                await this.createNewTab();
                return;
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
            
            // Check if we can capture screenshot
            const tab = await chrome.tabs.get(this.tabId);
            if (this.isInternalUrl(tab.url)) {
                console.log('Cannot capture screenshot of internal page');
                return null;
            }
            
            const result = await chrome.tabs.captureVisibleTab(this.windowId, {
                format: 'png',
                quality: 100
            });
            return result;
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