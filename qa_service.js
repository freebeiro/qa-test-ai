class QAService {
    constructor() {
        this.visionService = new VisionService();
        this.activeTabId = null;
    }

    async initialize(tabId) {
        this.activeTabId = tabId;
    }

    async analyzeCurrentPage() {
        try {
            // Inject content script to capture screenshot and page info
            await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                function: this.capturePageInfo
            });

            // Get the screenshot using chrome.tabs API
            const [{ data: screenshot }] = await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                function: () => {
                    return new Promise((resolve) => {
                        chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
                            resolve(response.screenshot);
                        });
                    });
                }
            });

            // Analyze the screenshot using vision model
            const analysis = await this.visionService.analyzeScreenshot(screenshot);

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

    async capturePageInfo() {
        // This function runs in the context of the web page
        const pageInfo = {
            url: window.location.href,
            title: document.title,
            elements: []
        };

        // Collect information about interactive elements
        const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            pageInfo.elements.push({
                type: element.tagName.toLowerCase(),
                text: element.textContent?.trim() || '',
                location: {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                },
                attributes: {
                    id: element.id,
                    class: element.className,
                    role: element.getAttribute('role'),
                    ariaLabel: element.getAttribute('aria-label')
                }
            });
        });

        return pageInfo;
    }

    async findAndClick(selector, options = {}) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                func: (selector, options) => {
                    let element = document.querySelector(selector);
                    
                    if (!element && options.text) {
                        // Try finding by text content
                        const elements = document.querySelectorAll('button, a, input, [role="button"]');
                        element = Array.from(elements).find(el => 
                            el.textContent?.toLowerCase().includes(options.text.toLowerCase())
                        );
                    }
                    
                    if (element) {
                        element.click();
                        return true;
                    }
                    return false;
                },
                args: [selector, options]
            });

            return result[0].result;
        } catch (error) {
            console.error('Click operation failed:', error);
            return false;
        }
    }

    async fillForm(selector, value) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                func: (selector, value) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.value = value;
                        // Trigger input event for reactive frameworks
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                        return true;
                    }
                    return false;
                },
                args: [selector, value]
            });

            return result[0].result;
        } catch (error) {
            console.error('Form fill failed:', error);
            return false;
        }
    }

    async waitForNavigation() {
        return new Promise((resolve) => {
            const listener = (tabId, changeInfo) => {
                if (tabId === this.activeTabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve(true);
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    async getPageState() {
        try {
            const [{ result: pageInfo }] = await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                function: () => ({
                    url: window.location.href,
                    title: document.title
                })
            });

            const [{ result: screenshot }] = await chrome.scripting.executeScript({
                target: { tabId: this.activeTabId },
                function: () => {
                    return new Promise((resolve) => {
                        chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, (response) => {
                            resolve(response.screenshot);
                        });
                    });
                }
            });

            return {
                ...pageInfo,
                screenshot
            };
        } catch (error) {
            console.error('Failed to get page state:', error);
            throw error;
        }
    }

    async cleanup() {
        this.activeTabId = null;
    }
}

export default QAService; 