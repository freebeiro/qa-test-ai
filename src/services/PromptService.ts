export class PromptService {
    /**
     * Creates a prompt for initial planning of steps
     */
    static createPlanningPrompt(
        goal: string, 
        context: any, 
        failedAttempts: Record<string, number>, 
        learnings: Record<string, any>
    ): string {
        return `
You are an autonomous web browser assistant. Your task is to help achieve the user's goal: "${goal}"

Current Context: ${JSON.stringify(context || {}, null, 2)}
Previous Attempts: ${JSON.stringify(failedAttempts || {}, null, 2)}
Learned Information: ${JSON.stringify(learnings || {}, null, 2)}

Available MidScene Commands:
- navigate(url): Navigate to a specific URL
- click(selector): Click an element matching the CSS selector
- type(selector, text): Type text into an input field
- extract(selector): Extract text content from elements
- wait(ms): Wait for a specified time in milliseconds

Think step by step:
1. What's the current state?
2. What steps are needed to achieve the goal?
3. What could go wrong?
4. How to verify success?

Return a JSON array of steps:
[
    {
        "command": "the command to execute",
        "reasoning": "why this step is needed",
        "expected_result": "what should happen after this step"
    }
]`;
    }

    /**
     * Creates a prompt for analyzing step results
     */
    static createAnalysisPrompt(
        step: { command: string; reasoning: string; expected_result: string }, 
        result: any, 
        context: any
    ): string {
        return `
STEP EXECUTED: ${JSON.stringify(step)}
RESULT: ${JSON.stringify(result)}
CONTEXT: ${JSON.stringify(context)}

Analyze the execution result and determine:
1. Was the step successful? Compare actual result with expected_result
2. Do we need more information from the user?
3. Should we try a different approach?
4. Are there any errors to handle?

Return JSON with:
{
    "success": boolean,
    "needsUserInput": boolean,
    "question": "question to ask if needed",
    "error": "error description if failed"
}`;
    }

    /**
     * Creates a prompt for error recovery planning
     */
    static createErrorRecoveryPrompt(
        step: { command: string; reasoning: string }, 
        error: Error,
        context: any
    ): string {
        return `
ERROR OCCURRED:
Step: ${JSON.stringify(step)}
Error: ${error.message}
Context: ${JSON.stringify(context)}

How should we handle this error? Consider:
1. Different selectors or approaches
2. Breaking down into smaller steps
3. Alternative ways to achieve the same goal

Return JSON with:
{
    "reasoning": "your analysis of the error",
    "questions": ["questions to ask if needed"],
    "alternative_plan": [
        {
            "command": "alternative command",
            "reasoning": "why this might work better",
            "expected_result": "what should happen"
        }
    ]
}`;
    }

    /**
     * Creates a prompt for planning alternative approaches
     */
    static createAlternativePlanPrompt(
        failedStep: { command: string; reasoning: string }, 
        error: string,
        context: any
    ): string {
        return `
FAILED STEP: ${JSON.stringify(failedStep)}
ERROR: ${error}
CONTEXT: ${JSON.stringify(context)}

Create an alternative plan to achieve the same goal.
Consider:
1. Different selectors or approaches
2. Breaking down into smaller steps
3. Using different navigation paths

Return a JSON array of alternative steps, each with:
{
    "command": "the command to execute",
    "reasoning": "why this alternative might work better",
    "expected_result": "what should happen"
}`;
    }
} 