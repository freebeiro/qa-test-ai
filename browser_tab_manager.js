import Command from './command.js';

class BrowserTabManager {
    constructor() {
        this.tabId = null;
        this.port = null;
        this.initializeConnection();
        console.log('🔧 Initializing BrowserTabManager');
    }

    initializeConnection() {
        this.port = chrome.runtime.connect({ name: "qa-window" });
        
        this.port.onMessage.addListener((message) => {
            if (message.type === 'INIT_STATE') {
                this.tabId = message.browserTabId;
                console.log(`🔧 Initialized with browser tab ID: ${this.tabId}`);
            }
        });
    }

    async navigate(url) {
        if (!this.tabId) {
            throw new Error('Browser tab ID not initialized');
        }
        return await chrome.tabs.update(this.tabId, { url });
    }

    async captureScreenshot() {
        const tab = await chrome.tabs.get(this.tabId);
        return await chrome.tabs.captureVisibleTab(tab.windowId, {
            format: 'png',
            quality: 100
        });
    }

    async executeScript(func, args) {
        console.log(`🔧 Executing script with args:`, args);
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: this.tabId },
                function: func,
                args: args
            });
            console.log('✅ Script execution result:', result);
            return result;
        } catch (error) {
            console.error('❌ Script execution failed:', error);
            throw error;
        }
    }
}

export default BrowserTabManager;
