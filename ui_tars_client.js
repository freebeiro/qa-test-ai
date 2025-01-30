class UITarsClient {
    constructor(config) {
        this.endpoint = config?.uiTars?.endpoint || 'http://localhost:8001/v1/chat/completions';
        this.initialized = false;
    }

    async analyze(command, pageState) {
        console.log('🔍 UI-TARS Processing:', command);

        try {
            // Prepare the request body following UI-TARS format
            const request = {
                messages: [{
                    role: "user",
                    content: command,
                    visual_states: pageState
                }],
                model: "ui-tars",
                temperature: 0.7,
                stream: false
            };

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error(`UI-TARS API error: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('UI-TARS Response:', result);

            return {
                understanding: {
                    command: command,
                    confidence: 1.0
                },
                elements: [],
                actions: [{
                    type: command.toLowerCase().includes('search') ? 'search' : 'navigate',
                    parameters: {
                        query: command.replace(/search for ["']?([^"']+)["']?/i, '$1')
                    }
                }],
                visualContext: {}
            };

        } catch (error) {
            console.error('❌ UI-TARS analysis failed:', error);
            // Return a fallback analysis
            return {
                understanding: {
                    command: command,
                    confidence: 0.5
                },
                elements: [],
                actions: [{
                    type: command.toLowerCase().includes('search') ? 'search' : 'navigate',
                    parameters: {
                        query: command.replace(/search for ["']?([^"']+)["']?/i, '$1')
                    }
                }],
                visualContext: {}
            };
        }
    }
}

export default UITarsClient;