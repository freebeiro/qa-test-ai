interface CommandRecord {
    command: string;
    screenshots: Array<{
        data: string;
        caption: string;
    }>;
    timestamp: string;
    error?: string;
}

export class MidsceneService {
    private browserTabId: number;
    private commandHistory: CommandRecord[] = [];
    
    constructor(browserTabId: number) {
        this.browserTabId = browserTabId;
    }
    
    async initialize() {
        console.log('🚀 Initializing MidsceneService with tab:', this.browserTabId);
        return true;
    }

    private async executeScript<T>(func: (...args: any[]) => T, ...args: any[]): Promise<T> {
        if (!this.browserTabId) throw new Error('Browser tab not initialized');
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            func,
            args
        });
        
        return result[0].result as T;
    }

    async executeCommand(command: string): Promise<{
        error?: string;
        screenshots: Array<{data: string; caption: string}>;
    }> {
        // Execute MidScene command and capture screenshot
        try {
            // Take screenshot before action
            const beforeScreenshot = await this.captureScreenshot(`Before: ${command}`);
            
            // Parse and execute command
            const [action, ...params] = command.split('(');
            const cleanParams = params.join('(').replace(')', '');
            
            switch(action) {
                case 'navigate':
                    await this.navigate(cleanParams.replace(/['"]/g, ''));
                    break;
                case 'click':
                    await this.click(cleanParams.replace(/['"]/g, ''));
                    break;
                case 'type':
                    const [selector, text] = cleanParams.split(',').map(p => p.trim().replace(/['"]/g, ''));
                    await this.type(selector, text);
                    break;
                // Add other commands...
            }

            // Take screenshot after action
            const afterScreenshot = await this.captureScreenshot(`After: ${command}`);

            return {
                screenshots: [
                    { data: beforeScreenshot, caption: `Before: ${command}` },
                    { data: afterScreenshot, caption: `After: ${command}` }
                ]
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                error: errorMessage,
                screenshots: []
            };
        }
    }

    async captureScreenshot(caption: string): Promise<string> {
        const windowInfo = await chrome.windows.getCurrent();
        return await chrome.tabs.captureVisibleTab(windowInfo.id!, {
            format: 'png'
        });
    }

    private async navigate(url: string): Promise<void> {
        await chrome.tabs.update(this.browserTabId, { url });
        await this.waitForPageLoad();
    }

    private async click(selector: string): Promise<void> {
        await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            func: (sel) => {
                const element = document.querySelector(sel);
                if (element instanceof HTMLElement) {
                    element.click();
                    return true;
                }
                throw new Error(`Element not found: ${sel}`);
            },
            args: [selector]
        });
    }

    private async type(selector: string, text: string): Promise<void> {
        await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            func: (sel, txt) => {
                const element = document.querySelector(sel);
                if (element instanceof HTMLInputElement) {
                    element.value = txt;
                    element.dispatchEvent(new Event('input'));
                    return true;
                }
                throw new Error(`Input not found: ${sel}`);
            },
            args: [selector, text]
        });
    }

    private waitForPageLoad(): Promise<void> {
        const browserTabId = this.browserTabId; // Store reference
        return new Promise((resolve) => {
            const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
                if (tabId === browserTabId && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    async destroy() {
        // Nothing to clean up for now
    }
} 