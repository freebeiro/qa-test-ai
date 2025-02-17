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
                } catch (error) {
                    console.error('Failed to get window ID:', error);
                }
            }
        });
    }

    async navigate(url) {
        await this.ensureTabActive();
        return await chrome.tabs.update(this.tabId, { url });
    }

    async ensureTabActive() {
        if (!this.tabId || !this.windowId) {
            throw new Error('Browser tab not initialized');
        }
        await chrome.windows.update(this.windowId, { focused: true });
        await chrome.tabs.update(this.tabId, { active: true });
        await new Promise(resolve => setTimeout(resolve, 500));
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
            return await chrome.scripting.executeScript({
                target: { tabId: this.tabId },
                function: func,
                args: args
            });
        } catch (error) {
            console.error('❌ Script execution failed:', error);
            throw error;
        }
    }
}