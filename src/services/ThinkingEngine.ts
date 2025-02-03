import { LLMService } from './LLMService';

interface Thought {
    step: number;
    reasoning: string;
    action?: string;
    questions?: string[];
    observations?: string[];
}

interface ThinkingProcess {
    goal: string;
    thoughts: Thought[];
    currentState: any;
    nextAction?: string;
    questions?: string[];
    conclusions?: string[];
}

interface ThinkingResponse {
    reasoning: string;
    nextAction?: string;
    questions?: string[];
}

export class ThinkingEngine {
    private llm: LLMService;
    private context: any = {};
    private memory: any = {};

    constructor(config: { endpoint: string; model: string }) {
        this.llm = new LLMService(config);
    }

    async think(goal: string, currentState: any): Promise<ThinkingProcess> {
        const prompt = this.createPrompt(goal, currentState);
        const llmResponse = await this.llm.think(prompt) as ThinkingResponse;

        return {
            goal,
            thoughts: [{
                step: 1,
                reasoning: llmResponse.reasoning,
                action: llmResponse.nextAction,
                questions: llmResponse.questions
            }],
            currentState,
            nextAction: llmResponse.nextAction,
            questions: llmResponse.questions,
            conclusions: []
        };
    }

    private createPrompt(goal: string, state: any): string {
        return `
Current goal: ${goal}
Current page state: ${JSON.stringify(state, null, 2)}
Previous context: ${JSON.stringify(this.context, null, 2)}
Previous learnings: ${JSON.stringify(this.memory, null, 2)}

Think carefully about how to achieve this goal:
1. What is the current state of the page?
2. What obstacles might we face?
3. What information do we need?
4. What's the most efficient next step?

If you need any information or credentials, ask questions.
If you're unsure about any step, ask for clarification.

Return a JSON response with:
{
    "reasoning": "your step-by-step analysis",
    "nextAction": "the next action to take",
    "questions": ["any questions you need answered"],
    "findings": {"any relevant information found"}
}`;
    }

    private analyzeState(state: any): string[] {
        const observations = [];
        
        // Check for forms
        if (state.forms?.length > 0) {
            observations.push(`Found ${state.forms.length} forms`);
            state.forms.forEach((form: any) => {
                const fields = form.fields.map((f: any) => f.name || f.type).join(', ');
                observations.push(`Form fields: ${fields}`);
            });
        }

        // Check for navigation elements
        if (state.links?.length > 0) {
            const relevantLinks = state.links
                .filter((link: any) => link.visible)
                .map((link: any) => link.text)
                .join(', ');
            observations.push(`Visible links: ${relevantLinks}`);
        }

        // Check for interactive elements
        if (state.buttons?.length > 0) {
            const buttonTexts = state.buttons
                .filter((btn: any) => btn.visible)
                .map((btn: any) => btn.text)
                .join(', ');
            observations.push(`Available buttons: ${buttonTexts}`);
        }

        return observations;
    }

    private identifyObstacles(state: any, goal: string): string[] {
        const obstacles = [];

        // Check for login requirements
        if (state.forms?.some((f: any) => 
            f.fields.some((field: any) => 
                field.type === 'password' || 
                field.name?.includes('login')
            )
        )) {
            obstacles.push("Login might be required");
        }

        // Check for navigation barriers
        if (state.links?.length === 0 && goal.includes('find')) {
            obstacles.push("No navigation links found");
        }

        // Check for required interactions
        if (goal.includes('submit') && !state.forms?.length) {
            obstacles.push("No form found to submit");
        }

        return obstacles;
    }

    private async planNextAction(goal: string, state: any, obstacles: string[]): Promise<{
        action?: string;
        reasons: string[];
        needsUserInput: boolean;
        questions?: string[];
    }> {
        // If there are obstacles that need user input
        if (obstacles.some(o => o.includes('login'))) {
            return {
                needsUserInput: true,
                reasons: ['Login required'],
                questions: ['Are you already logged in?', 'Should I proceed with login?']
            };
        }

        // Plan next action based on goal and state
        const action = this.determineNextAction(goal, state);
        return {
            action: action.command,
            reasons: action.reasons,
            needsUserInput: false
        };
    }

    private determineNextAction(goal: string, state: any): {
        command: string;
        reasons: string[];
    } {
        // Navigation goals
        if (goal.includes('go to') || goal.includes('find')) {
            return {
                command: `navigate(${this.extractTarget(goal)})`,
                reasons: ['Navigation required to reach target']
            };
        }

        // Interaction goals
        if (goal.includes('click') || goal.includes('select')) {
            const target = this.findBestMatch(goal, state);
            return {
                command: `click(${target})`,
                reasons: [`Found matching element: ${target}`]
            };
        }

        // Form filling goals
        if (goal.includes('fill') || goal.includes('type')) {
            return {
                command: `fill(${this.extractFormData(goal)})`,
                reasons: ['Form input required']
            };
        }

        return {
            command: 'analyze()',
            reasons: ['Need more information to proceed']
        };
    }

    private considerAlternatives(plan: any): string[] {
        const alternatives = [];
        
        if (plan.action?.includes('navigate')) {
            alternatives.push('Could search for the content instead');
            alternatives.push('Could look for existing tabs with this content');
        }

        if (plan.action?.includes('click')) {
            alternatives.push('Could use keyboard shortcuts');
            alternatives.push('Could try direct URL navigation');
        }

        return alternatives;
    }

    // Helper methods
    private extractTarget(goal: string): string {
        // Implementation to extract target from goal
        return goal.split(' ').pop() || '';
    }

    private findBestMatch(goal: string, state: any): string {
        // Implementation to find best matching element
        return 'best_match_selector';
    }

    private extractFormData(goal: string): string {
        // Implementation to extract form data
        return 'form_data';
    }
} 