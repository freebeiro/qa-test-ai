export class VisionService {
    constructor() {
        this.ollamaEndpoint = 'http://localhost:11434/api/generate';
        this.model = 'llama3.2-vision';
    }

    async analyzeScreenshot(screenshotBase64) {
        try {
            // Remove data URL prefix if present and ensure proper base64 encoding
            const base64Data = screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                body: JSON.stringify({
                    model: this.model,
                    stream: false,
                    prompt: "Analyze this webpage screenshot. Identify and describe: 1) Clickable elements 2) Input fields 3) Navigation elements 4) Main content areas 5) Layout structure. Focus on interactive elements and their locations.",
                    images: [base64Data]
                })
            });

            if (!response.ok) {
                throw new Error(`Vision API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseVisionResponse(data);
        } catch (error) {
            console.error('Vision analysis failed:', error);
            throw error;
        }
    }

    parseVisionResponse(response) {
        // Process the vision model's response to extract useful information
        const analysis = {
            elements: this.extractElements(response),
            text: response.response, // Changed from response.text to response.response
            suggestions: this.generateInteractionSuggestions(response)
        };
        
        console.log('Vision Analysis:', analysis);
        return analysis;
    }

    extractElements(response) {
        // Extract information about UI elements from the vision response
        const elements = [];
        
        try {
            const text = response.response;
            
            // Extract clickable elements
            const buttonMatches = text.match(/button[^\.]*\./gi) || [];
            const linkMatches = text.match(/link[^\.]*\./gi) || [];
            
            // Extract input fields
            const inputMatches = text.match(/input[^\.]*\./gi) || [];
            const formMatches = text.match(/form[^\.]*\./gi) || [];
            
            elements.push(
                ...buttonMatches.map(match => ({ type: 'button', description: match })),
                ...linkMatches.map(match => ({ type: 'link', description: match })),
                ...inputMatches.map(match => ({ type: 'input', description: match })),
                ...formMatches.map(match => ({ type: 'form', description: match }))
            );
        } catch (error) {
            console.error('Error extracting elements:', error);
        }
        
        return elements;
    }

    generateInteractionSuggestions(response) {
        const suggestions = [];
        try {
            const text = response.response;
            
            // Look for actionable elements
            if (text.includes('button')) suggestions.push('Try clicking the identified buttons');
            if (text.includes('input')) suggestions.push('You can fill out the input fields');
            if (text.includes('form')) suggestions.push('Complete and submit the form');
            if (text.includes('link')) suggestions.push('Navigate using the available links');
            
        } catch (error) {
            console.error('Error generating suggestions:', error);
        }
        return suggestions;
    }

    async findElementByIntent(screenshotBase64, intent) {
        try {
            // Ask the vision model to specifically look for elements matching our intent
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    stream: false,
                    prompt: `Find the best element matching this user intention: "${intent}"
                            Consider:
                            1. Element text and purpose
                            2. Visual appearance and location
                            3. Common patterns for this type of element
                            4. Context and surrounding elements
                            
                            Describe the best matching element in detail, including:
                            1. Exact location (top, bottom, left, right, center)
                            2. Visual characteristics
                            3. Confidence level (0-100)
                            4. Why this is the best match
                            
                            Format response as JSON with these fields:
                            {"location", "description", "confidence", "reasoning"}
                            `,
                    images: [screenshotBase64]
                })
            });

            if (!response.ok) {
                throw new Error(`Vision API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            return this.parseElementMatch(data);
        } catch (error) {
            console.error('Element finding failed:', error);
            throw error;
        }
    }

    parseElementMatch(response) {
        try {
            // Extract the JSON object from the model's text response
            const jsonMatch = response.response.match(/\{[^}]+\}/);            
            if (jsonMatch) {
                const elementInfo = JSON.parse(jsonMatch[0]);
                return {
                    location: this.parseLocation(elementInfo.location),
                    description: elementInfo.description,
                    confidence: parseInt(elementInfo.confidence) / 100,
                    reasoning: elementInfo.reasoning
                };
            }
            return null;
        } catch (error) {
            console.error('Failed to parse element match:', error);
            return null;
        }
    }

    parseLocation(locationText) {
        // Convert textual location to more precise coordinates
        const coords = {
            x: 0.5,  // Default to center
            y: 0.5
        };

        // More granular coordinate adjustments
        if (locationText.includes('top')) {
            coords.y = locationText.includes('very top') ? 0.1 : 0.25;
        }
        if (locationText.includes('bottom')) {
            coords.y = locationText.includes('very bottom') ? 0.9 : 0.75;
        }
        if (locationText.includes('left')) {
            coords.x = locationText.includes('far left') ? 0.1 : 0.25;
        }
        if (locationText.includes('right')) {
            coords.x = locationText.includes('far right') ? 0.9 : 0.75;
        }
        if (locationText.includes('center')) {
            coords.x = 0.5;
            coords.y = 0.5;
        }

        return coords;
    }

    // Helper method to ensure page is fully loaded
    async waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        });
    }
}
