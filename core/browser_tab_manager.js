class BrowserTabManager {
    constructor() {
        this.port = null;
        this.initializeConnection();
        console.log('🔧 Initializing BrowserTabManager');
    }

    initializeConnection() {
        this.port = chrome.runtime.connect({ name: "qa-window" });
        this.setupMessageHandling();
    }

    setupMessageHandling() {
        this.port.onMessage.addListener((message) => {
            console.log('Received message:', message);
        });
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            const messageHandler = (response) => {
                if (response.type === 'COMMAND_RESULT') {
                    this.port.onMessage.removeListener(messageHandler);
                    if (response.success) {
                        resolve(response);
                    } else {
                        reject(new Error(response.error));
                    }
                }
            };

            this.port.onMessage.addListener(messageHandler);
            this.port.postMessage({
                type: 'EXECUTE_COMMAND',
                command: command
            });
        });
    }

    async navigate(url) {
        return this.executeCommand({
            type: 'navigation',
            url: url
        });
    }

    async executeScript(func, args = []) {
        return this.executeCommand({
            type: 'executeScript',
            function: func.toString(),
            args: args
        });
    }

    async back() {
        return this.executeCommand({
            type: 'back'
        });
    }

    async forward() {
        return this.executeCommand({
            type: 'forward'
        });
    }

    async refresh() {
        return this.executeCommand({
            type: 'refresh'
        });
    }

    async find(text) {
        return this.executeCommand({
            type: 'find',
            text: text
        });
    }

    async click(target) {
        return this.executeCommand({
            type: 'click',
            target: target
        });
    }

    async scroll(direction) {
        return this.executeCommand({
            type: 'scroll',
            direction: direction
        });
    }

    async captureScreenshot() {
        return this.executeCommand({
            type: 'screenshot'
        });
    }
}

export default BrowserTabManager;