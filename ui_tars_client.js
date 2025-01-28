// This module handles communication with the UI-TARS language model
// It sends page analysis requests and receives intelligent interaction plans

class UITarsClient {
    constructor(config) {
        this.endpoint = config.uiTars.endpoint;
        this.initialized = false;
    }

    async analyze(command, domContent, context = {}) {
        console.log('Requesting UI-TARS analysis for:', command);

        // We structure our prompt to help UI-TARS understand the task
        const prompt = {
            role: "user",
            content: [{
                text: `Analyze this webpage and create an interaction plan for the command: ${command}`,
                context: context,
                requirements: {
                    // What we need UI-TARS to identify and explain
                    task_understanding: "Explain what interaction is needed",
                    element_identification: "Find relevant interface elements",
                    interaction_strategy: "Determine how to interact with elements",
                    verification_plan: "How to confirm the action succeeded"
                }
            }, {
                dom: domContent  // The actual page content to analyze
            }]
        };

        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: "ui-tars",
                    messages: [prompt]
                })
            });

            if (!response.ok) {
                throw new Error(`UI-TARS API error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('UI-TARS analysis received:', data);

            // Parse and validate the interaction plan
            return this.parseAnalysisResponse(data);

        } catch (error) {
            console.error('UI-TARS analysis failed:', error);
            throw error;
        }
    }

    parseAnalysisResponse(response) {
        // Extract the interaction plan from UI-TARS's response
        const content = response.choices[0].message.content;
        const plan = JSON.parse(content);

        // Validate that we have all required components
        this.validateInteractionPlan(plan);

        return {
            understanding: plan.understanding,  // What UI-TARS thinks needs to be done
            elements: plan.elements,           // What elements to interact with
            strategy: plan.strategy,           // How to interact with them
            verification: plan.verification,   // How to verify success
            fallbacks: plan.fallbacks         // Alternative approaches if needed
        };
    }

    validateInteractionPlan(plan) {
        // Ensure we have all necessary parts of the plan
        const requiredFields = [
            'understanding',
            'elements',
            'strategy',
            'verification'
        ];

        for (const field of requiredFields) {
            if (!plan[field]) {
                throw new Error(`Invalid interaction plan: missing ${field}`);
            }
        }

        // Validate element selectors
        if (!plan.elements.some(element => this.isValidSelector(element.selector))) {
            throw new Error('Invalid interaction plan: no valid element selectors');
        }
    }

    isValidSelector(selector) {
        try {
            // Test if the selector is syntactically valid
            document.querySelector(selector);
            return true;
        } catch (error) {
            return false;
        }
    }

    async executePlan(plan, context = {}) {
        console.log('Executing interaction plan:', plan);

        const results = [];
        let succeeded = false;

        // Try each element and strategy until one works
        for (const element of plan.elements) {
            try {
                const result = await this.executeElementInteraction(element, plan.strategy, context);
                results.push({ element, success: true, result });
                succeeded = true;
                break;
            } catch (error) {
                results.push({ element, success: false, error: error.message });
                // Continue to next element if this one fails
            }
        }

        // If all primary attempts failed, try fallbacks
        if (!succeeded && plan.fallbacks) {
            for (const fallback of plan.fallbacks) {
                try {
                    const result = await this.executeFallbackStrategy(fallback, context);
                    results.push({ strategy: fallback, success: true, result });
                    succeeded = true;
                    break;
                } catch (error) {
                    results.push({ strategy: fallback, success: false, error: error.message });
                }
            }
        }

        // Verify the interaction worked
        if (succeeded) {
            const verified = await this.verifyInteraction(plan.verification);
            if (!verified) {
                throw new Error('Interaction verification failed');
            }
        } else {
            throw new Error('All interaction attempts failed');
        }

        return {
            success: succeeded,
            results: results
        };
    }

    async executeElementInteraction(element, strategy, context) {
        // Execute the planned interaction with the element
        const executeScript = async (element, strategy, context) => {
            const targetElement = document.querySelector(element.selector);
            if (!targetElement) {
                throw new Error('Target element not found');
            }

            switch (strategy.type) {
                case 'input':
                    targetElement.value = context.value;
                    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
                    break;
                case 'click':
                    targetElement.click();
                    break;
                // Add more interaction types as needed
            }
        };

        // Execute in the context of the webpage
        await chrome.scripting.executeScript({
            target: { tabId: context.tabId },
            function: executeScript,
            args: [element, strategy, context]
        });
    }

    async verifyInteraction(verificationSteps) {
        for (const step of verificationSteps) {
            const verified = await this.executeVerificationStep(step);
            if (!verified) {
                return false;
            }
        }
        return true;
    }

    async executeVerificationStep(step) {
        // Execute verification logic based on step type
        const executeVerification = (step) => {
            switch (step.type) {
                case 'element_present':
                    return !!document.querySelector(step.selector);
                case 'element_value':
                    const element = document.querySelector(step.selector);
                    return element && element.value === step.expectedValue;
                case 'url_changed':
                    return window.location.href !== step.originalUrl;
                default:
                    throw new Error(`Unknown verification step type: ${step.type}`);
            }
        };

        // Execute with timeout
        const timeout = step.timeout || 5000;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
            const result = await chrome.scripting.executeScript({
                target: { tabId: context.tabId },
                function: executeVerification,
                args: [step]
            });

            if (result[0].result) {
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return false;
    }
}

export default UITarsClient;