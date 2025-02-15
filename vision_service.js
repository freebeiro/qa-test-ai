export class VisionService {
    constructor() {
        this.ollamaEndpoint = 'http://localhost:11434/api/generate';
        this.model = 'llama3.2-vision';
    }

    async analyzeScreenshot(screenshotBase64) {
        try {
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: "You are a computer vision expert analyzing a webpage. Please identify and describe:\n1. All clickable elements (buttons, links)\n2. Input fields and forms\n3. Main content areas\n4. Navigation elements\n5. The layout structure\nBe specific about locations and provide a structured analysis.",
                    images: [screenshotBase64]
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

    async findElementByText(page, text) {
        const elements = await page.$$('button, a, input, [role="button"]');
        
        for (const element of elements) {
            const textContent = await element.textContent();
            if (textContent?.toLowerCase().includes(text.toLowerCase())) {
                return element;
            }
        }
        
        return null;
    }

    async findElementByVisualLocation(page, description) {
        // Implement visual location search using Playwright
        const screenshot = await page.screenshot({ path: 'temp_screenshot.png' });
        const analysis = await this.analyzeScreenshot(screenshot.toString('base64'));
        
        // Use the analysis to find elements matching the description
        const elements = await page.$$('*');
        for (const element of elements) {
            const box = await element.boundingBox();
            if (box) {
                // Match the element's position with the description
                const matches = this.matchElementPosition(box, description, analysis);
                if (matches) return element;
            }
        }
        
        return null;
    }

    matchElementPosition(box, description, analysis) {
        // Simple position matching logic
        const pos = description.toLowerCase();
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        if (pos.includes('top') && centerY < 200) return true;
        if (pos.includes('bottom') && centerY > 400) return true;
        if (pos.includes('left') && centerX < 200) return true;
        if (pos.includes('right') && centerX > 400) return true;
        if (pos.includes('center') && centerX > 200 && centerX < 400 && centerY > 200 && centerY < 400) return true;
        
        return false;
    }
} 