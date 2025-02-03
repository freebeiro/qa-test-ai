interface LLMResponse {
    reasoning: string;
    nextAction?: string;
    questions?: string[];
    findings?: any;
}

export class LLMService {
    private ollamaEndpoint: string;
    private model: string;

    constructor(config: { endpoint: string; model: string }) {
        this.ollamaEndpoint = config.endpoint;
        this.model = config.model;
    }

    async think(prompt: string): Promise<{
        reasoning: string;
        questions?: string[];
    }> {
        try {
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt,
                    stream: false
                })
            });

            const data = await response.json();
            return this.parseResponse(data.response);
        } catch (error) {
            console.error('LLM API error:', error);
            throw error;
        }
    }

    private createSystemPrompt(userPrompt: string): string {
        return `You are an autonomous web explorer. Your task is to help navigate and interact with web pages.
Think step by step and explain your reasoning.

Available actions:
- navigate(url): Navigate to a URL
- click(selector): Click an element
- type(text): Type into focused element
- fill(fieldName, value): Fill a form field
- submit(): Submit a form
- extract(selector): Extract text from elements
- scroll(direction): Scroll the page
- wait(ms): Wait for a specified time

User request: ${userPrompt}

Return a JSON response with:
{
    "reasoning": "your step-by-step analysis",
    "nextAction": "the next action to take",
    "questions": ["any questions you need answered"],
    "findings": {"any relevant information found"}
}`;
    }

    private parseResponse(content: string): {
        reasoning: string;
        nextAction?: string;
        questions?: string[];
    } {
        try {
            return JSON.parse(content);
        } catch {
            return {
                reasoning: content,
                nextAction: this.extractAction(content)
            };
        }
    }

    private extractAction(content: string): string | undefined {
        const actionMatch = content.match(/(?:should|will|need to|must) (navigate|click|type|fill|submit|extract|scroll|wait)([^\.]+)?/i);
        return actionMatch ? `${actionMatch[1]}${actionMatch[2] || ''}` : undefined;
    }
} 