import { MidsceneService } from './MidsceneService';
import { LLMService } from './LLMService';
import { PromptService } from './PromptService';
import { config } from '../config';

interface PlanStep {
    command: string;
    reasoning: string;
    expected_result: string;
}

interface ExecutionResult {
    success: boolean;
    screenshot?: string;
    data?: any;
    error?: string;
}

export class ReasonerService {
    private midscene: MidsceneService;
    private llm: LLMService;
    private context: {
        goal: string;
        steps: Array<{
            plan: PlanStep;
            result: ExecutionResult;
            screenshot?: string;
        }>;
        learnings: Record<string, any>;
        failedAttempts: Record<string, number>;
    } = { 
        goal: '', 
        steps: [], 
        learnings: {},
        failedAttempts: {}
    };

    constructor(browserTabId: number) {
        this.midscene = new MidsceneService(browserTabId);
        this.llm = new LLMService(config.llm);
    }

    async executeGoal(goal: string): Promise<void> {
        console.log('🎯 Starting goal:', goal);
        this.context.goal = goal;
        
        // 1. Create initial plan using LLM
        const plan = await this.createPlan(goal);
        console.log('📋 Initial plan:', plan);

        // 2. Execute each step
        for (const step of plan) {
            console.log(`🔄 Executing: ${step.command}`);
            
            try {
                // Take screenshot before action
                await this.midscene.captureScreenshot(`Before: ${step.command}`);
                
                // Execute the MidScene command
                const result = await this.midscene.executeCommand(step.command);
                
                // Take screenshot after action
                await this.midscene.captureScreenshot(`After: ${step.command}`);

                // Store result
                this.context.steps.push({
                    plan: step,
                    result: {
                        success: !result.error,
                        error: result.error
                    }
                });

                // Analyze result using LLM
                const analysis = await this.analyzeStepResult(step, result);
                console.log('🔍 Analysis:', analysis);
                
                if (!analysis.success) {
                    console.log('⚠️ Step failed, analyzing failure...');
                    
                    // Let LLM suggest alternative approach
                    const alternativePlan = await this.createAlternativePlan(step, analysis.error!);
                    console.log('🔄 Alternative plan:', alternativePlan);
                    
                    // Execute alternative plan...
                    continue;
                }

                if (analysis.needsUserInput) {
                    console.log('❓ Need user input:', analysis.question);
                    const answer = await this.askUser(analysis.question!);
                    this.context.learnings[analysis.question!] = answer;
                    continue;
                }

            } catch (error) {
                console.error('❌ Error:', error);
                // Ask LLM how to handle the error
                const recovery = await this.llm.think(
                    PromptService.createErrorRecoveryPrompt({
                        command: step.command,
                        reasoning: step.reasoning
                    }, 
                    new Error(error instanceof Error ? error.message : String(error)),
                    this.context)
                );
                
                if (recovery.questions?.length) {
                    const answer = await this.askUser(recovery.questions[0]);
                    this.context.learnings[`recovery_${step.command}`] = answer;
                }
                continue;
            }
        }
    }

    private async createPlan(goal: string, context?: any): Promise<PlanStep[]> {
        const response = await this.llm.think(
            PromptService.createPlanningPrompt(goal, context, this.context.failedAttempts, this.context.learnings)
        );
        return JSON.parse(response.reasoning);
    }

    private async analyzeStepResult(step: PlanStep, result: any): Promise<{
        success: boolean;
        needsUserInput: boolean;
        question?: string;
        error?: string;
    }> {
        const response = await this.llm.think(
            PromptService.createAnalysisPrompt(step, result, this.context)
        );
        return JSON.parse(response.reasoning);
    }

    private async askUser(question: string): Promise<string> {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'ASK_USER',
                question
            }, response => {
                resolve(response);
            });
        });
    }

    private async createAlternativePlan(failedStep: PlanStep, error: string): Promise<PlanStep[]> {
        const response = await this.llm.think(
            PromptService.createAlternativePlanPrompt(failedStep, error, this.context)
        );
        return JSON.parse(response.reasoning);
    }
} 