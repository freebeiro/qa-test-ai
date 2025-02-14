/**
 * UI-TARS Ollama Client Service
 * Handles communication with the Ollama UI-TARS model for visual understanding
 */

class UITarsClient {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'http://localhost:11434';
        this.model = config.model || 'ui-tars';
        this.maxRetries = config.maxRetries || 3;
    }

    /**
     * Process a screenshot with UI-TARS model
     * @param {string} screenshot - Base64 encoded screenshot
     * @param {string} query - Natural language query about the UI
     * @returns {Promise<Object>} - Processed response from UI-TARS
     */
    async processScreenshot(screenshot, query) {
        const prompt = this._buildPrompt(screenshot, query);
        
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        num_predict: 1024,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return this._parseResponse(result);
        } catch (error) {
            console.error('Error processing screenshot:', error);
            throw error;
        }
    }

    /**
     * Build the prompt for UI-TARS
     * @private
     */
    _buildPrompt(screenshot, query) {
        return `<image>${screenshot}</image>
Based on the screenshot above, ${query}

Provide a detailed analysis of the UI elements and their relationships. Focus on:
1. Element locations and hierarchy
2. Interactive elements (buttons, links, inputs)
3. Visual relationships between elements
4. Accessibility considerations`;
    }

    /**
     * Parse and structure the UI-TARS response
     * @private
     */
    _parseResponse(response) {
        // Add response parsing logic based on your needs
        return {
            elements: this._extractElements(response.response),
            analysis: response.response,
            // Add more structured data as needed
        };
    }

    /**
     * Extract UI elements from the response
     * @private
     */
    _extractElements(response) {
        // Implement element extraction logic
        // This should identify buttons, links, inputs, etc.
        return [];
    }
}

export default UITarsClient;