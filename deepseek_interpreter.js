class DeepSeekInterpreter {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.conversationHistory = [];
    }

    async processUserCommand(command, pageContext) {
        console.log('Processing command with DeepSeek R1:', command);

        // First, use Reasoner mode to understand intent
        const reasonerResult = await this.useReasonerMode(command, pageContext);
        console.log('Reasoner output:', reasonerResult);

        // If command is ambiguous, switch to Chat mode for clarification
        if (reasonerResult.needsClarification) {
            console.log('Command needs clarification, switching to chat mode');
            return this.handleClarification(command, reasonerResult.questions);
        }

        // Convert understood intent to UI-TARS compatible format
        return this.convertToUiTarsCommands(reasonerResult);
    }

    async useReasonerMode(command, pageContext) {
        const response = await fetch(`${this.baseUrl}/reason`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: `
                Analyze this user command for web automation:
                Command: "${command}"
                
                Current Page Context:
                URL: ${pageContext.url}
                Title: ${pageContext.title}
                
                Previous Actions:
                ${JSON.stringify(this.conversationHistory)}
                
                Return a structured analysis including:
                1. Main intent
                2. Required actions
                3. Any ambiguities that need clarification
                4. UI elements to interact with
                `
            })
        });

        const result = await response.json();
        return this.parseReasonerResponse(result);
    }

    async handleClarification(command, questions) {
        const chatHistory = [
            { role: 'user', content: command }
        ];

        const response = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatHistory,
                context: {
                    type: 'clarification',
                    questions: questions
                }
            })
        });

        const result = await response.json();
        return {
            type: 'clarification',
            questions: result.content,
            originalCommand: command
        };
    }

    parseReasonerResponse(response) {
        // Structure the reasoner output for our needs
        const analysis = response.output || response;
        
        return {
            needsClarification: analysis.ambiguities && analysis.ambiguities.length > 0,
            questions: analysis.ambiguities,
            intent: analysis.intent,
            actions: analysis.actions,
            elements: analysis.elements
        };
    }

    async convertToUiTarsCommands(reasonerResult) {
        // Convert DeepSeek's output to UI-TARS compatible commands
        const commands = {
            type: 'action',
            actions: reasonerResult.actions.map(action => ({
                type: action.type,
                selector: action.element?.selector,
                value: action.value,
                description: action.description
            })),
            explanation: `I'll help you ${reasonerResult.intent.description}`
        };

        this.conversationHistory.push({
            type: 'command',
            content: commands
        });

        return commands;
    }

    // Helper method to maintain conversation context
    addToHistory(item) {
        this.conversationHistory.push(item);
        // Keep history manageable
        if (this.conversationHistory.length > 10) {
            this.conversationHistory.shift();
        }
    }
}

export default DeepSeekInterpreter;