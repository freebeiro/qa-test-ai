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
                    
                    // Ensure the tab is ready
                    await this.ensureTabActive();
                } catch (error) {
                    console.error('Failed to get window ID:', error);
                    // Try to create a new tab if getting the existing one fails
                    await this.createNewTab();
                }
            }
        });
    }

    async createNewTab() {
        try {
            console.log('Creating new browser tab...');
            const tab = await chrome.windows.create({ 
                url: 'about:blank',
                type: 'popup',
                width: 800,
                height: 600,
                focused: true
            });
            this.tabId = tab.tabs[0].id;
            this.windowId = tab.id;
            console.log(`Created new window with ID: ${this.windowId} and tab ID: ${this.tabId}`);
            
            // Store the tab ID in extension state
            await chrome.storage.local.set({ browserTabId: this.tabId });
        } catch (error) {
            console.error('Failed to create new window:', error);
            throw error;
        }
    }

    async navigate(url) {
        await this.ensureTabActive();
        // Ensure URL has protocol
        const processedUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
        return await chrome.tabs.update(this.tabId, { url: processedUrl });
    }

    async ensureTabActive() {
        if (!this.tabId || !this.windowId) {
            console.log('No active tab, creating new one...');
            await this.createNewTab();
        }
        
        try {
            await chrome.windows.update(this.windowId, { focused: true });
            await chrome.tabs.update(this.tabId, { active: true });
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Failed to activate tab:', error);
            await this.createNewTab();
        }
    }

    async captureScreenshot() {
        await this.ensureTabActive();
        try {
            const result = await chrome.tabs.captureVisibleTab(this.windowId, {
                format: 'png',
                quality: 100
            });
            return result;
        } catch (error) {
            console.error('❌ Screenshot capture failed:', error);
            throw error;
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