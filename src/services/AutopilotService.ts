import { ThinkingEngine } from './ThinkingEngine';
import { config } from '../config';

interface ActionPlan {
    actions: Array<{
        type: string;
        params: any;
        description: string;
    }>;
    reasoning: string;
    questions?: string[];
    findings?: any;
    nextAction?: {
        type: string;
        params: any;
        description: string;
    };
    isCompleted?: boolean;
}

interface PageState {
    url: string;
    title: string;
    forms: any[];
    links: any[];
    buttons: any[];
    visibleText: string[];
}

export class AutopilotService {
    private browserTabId: number;
    private pageContext: any = {};
    private learnings: any = {};
    private currentGoal: string = '';
    private thinkingEngine: ThinkingEngine;

    constructor(browserTabId: number) {
        this.browserTabId = browserTabId;
        this.thinkingEngine = new ThinkingEngine({
            endpoint: config.llm.endpoint,
            model: config.llm.model
        });
    }

    private isElementVisible(el: Element): boolean {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    private async waitForPageLoad(): Promise<void> {
        return new Promise((resolve) => {
            const listener = (tabId: number, info: chrome.tabs.TabChangeInfo) => {
                if (tabId === this.browserTabId && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            };
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    private parseActionParams(action: string): any {
        const paramsMatch = action.match(/\((.*)\)/);
        if (!paramsMatch) return {};
        
        const paramsStr = paramsMatch[1];
        try {
            return JSON.parse(`{${paramsStr}}`);
        } catch {
            return {};
        }
    }

    async explore(goal: string): Promise<void> {
        this.currentGoal = goal;
        let isCompleted = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 5;

        while (!isCompleted && attempts < MAX_ATTEMPTS) {
            // 1. Analyze current page
            const pageState = await this.analyzeCurrentPage();
            
            // 2. Think about the current situation
            const thinking = await this.thinkingEngine.think(goal, pageState);
            
            // Log thinking process
            thinking.thoughts.forEach(thought => {
                console.log(`Step ${thought.step}: ${thought.reasoning}`);
                thought.observations?.forEach(obs => console.log(`- ${obs}`));
            });

            // 3. Handle questions if any
            if (thinking.questions?.length) {
                const question = thinking.questions[0];
                await this.captureScreenshot(`Question: ${question}`);
                const answer = await this.askUser(question);
                this.learnings[question] = answer;
                continue;
            }

            // 4. Execute planned action
            if (thinking.nextAction) {
                try {
                    await this.executeAction({
                        type: thinking.nextAction.split('(')[0],
                        params: this.parseActionParams(thinking.nextAction),
                        description: thinking.thoughts[thinking.thoughts.length - 1].reasoning
                    });
                    
                    await this.captureScreenshot(`After: ${thinking.nextAction}`);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const errorThought = await this.thinkingEngine.think(
                        `handle error: ${errorMessage}`,
                        await this.analyzeCurrentPage()
                    );
                    
                    if (errorThought.questions?.length) {
                        const solution = await this.askUser(errorThought.questions[0]);
                        this.learnings[errorThought.questions[0]] = solution;
                    }
                    continue;
                }
            }

            attempts++;
            // Check if goal is completed
            const finalThought = await this.thinkingEngine.think(
                `verify if completed: ${goal}`,
                await this.analyzeCurrentPage()
            );
            isCompleted = !finalThought.questions?.length;
        }

        if (!isCompleted) {
            throw new Error(`I couldn't complete the task after ${MAX_ATTEMPTS} attempts. Would you like to try a different approach?`);
        }

        return this.pageContext.findings;
    }

    private needsUserInput(state: PageState): boolean {
        // Check for forms, password fields, or other input requirements
        return state.forms.some(form => 
            form.fields.some((field: any) => 
                field.type === 'password' || 
                field.name?.includes('email') ||
                field.name?.includes('username')
            )
        );
    }

    private createPrompt(pageState: PageState): string {
        return `
Current goal: ${this.currentGoal}
Current page state: ${JSON.stringify(pageState, null, 2)}
Previous learnings: ${JSON.stringify(this.learnings, null, 2)}

You are an autonomous web explorer. Your task is to achieve the user's goal.
If you need any information or credentials, ask questions.
If you're unsure about any step, ask for clarification.

Think step by step:
1. Analyze the current page state
2. Determine if we need any information from the user
3. Plan the next logical action
4. Consider potential obstacles

Available actions:
- navigate(url): Navigate to a URL
- click(selector): Click an element
- type(text): Type into focused element
- fill(fieldName, value): Fill a form field
- submit(): Submit a form
- extract(selector): Extract text from elements
- scroll(direction): Scroll the page
- wait(ms): Wait for a specified time

Return a JSON response with:
1. reasoning: Your analysis and thought process
2. nextAction: The next action to take
3. isCompleted: Whether the goal is achieved
4. questions: Any questions you need answered
5. findings: Any relevant information found
`;
    }

    private async askUser(question: string): Promise<string> {
        // This should be implemented in popup.js to show the question and get user input
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'ASK_USER',
                question
            }, response => {
                resolve(response);
            });
        });
    }

    private async analyzeCurrentPage(): Promise<PageState> {
        const analysis = await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            func: () => {
                return {
                    url: window.location.href,
                    title: document.title,
                    forms: Array.from(document.forms).map(form => ({
                        id: form.id,
                        action: form.action,
                        fields: Array.from(form.elements).map(el => ({
                            name: el.getAttribute('name'),
                            type: el.getAttribute('type'),
                            placeholder: el.getAttribute('placeholder'),
                            label: el.getAttribute('aria-label') || 
                                  el.getAttribute('placeholder') ||
                                  document.querySelector(`label[for="${el.id}"]`)?.textContent
                        }))
                    })),
                    links: Array.from(document.querySelectorAll('a')).map(a => ({
                        text: a.textContent?.trim(),
                        href: a.href,
                        visible: this.isElementVisible(a)
                    })),
                    buttons: Array.from(document.querySelectorAll('button')).map(b => ({
                        text: b.textContent?.trim(),
                        type: b.type,
                        visible: this.isElementVisible(b)
                    })),
                    visibleText: Array.from(document.querySelectorAll('h1,h2,h3,p'))
                        .filter(el => this.isElementVisible(el))
                        .map(el => el.textContent?.trim())
                        .filter((text): text is string => text !== undefined && text !== null)
                };

                function isElementVisible(el: Element): boolean {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                }
            }
        });
        
        if (!analysis || !analysis[0] || !analysis[0].result) {
            return {
                url: '',
                title: '',
                forms: [],
                links: [],
                buttons: [],
                visibleText: []
            };
        }
        
        return analysis[0].result;
    }

    private async askLLM(prompt: string): Promise<ActionPlan> {
        const currentUrl = await this.getCurrentUrl();
        
        if (!currentUrl.includes('github.com')) {
            return {
                actions: [],
                reasoning: "We need to navigate to GitHub first",
                nextAction: {
                    type: 'navigate',
                    params: { url: 'https://github.com' },
                    description: 'Navigating to GitHub'
                },
                isCompleted: false
            };
        }

        // Check if we're on the repositories page
        if (!currentUrl.includes('/repositories') && !currentUrl.includes('?tab=repositories')) {
            const pageState = await this.analyzeCurrentPage();
            const isLoggedIn = await this.checkIfLoggedIn();

            if (!isLoggedIn) {
                return {
                    actions: [],
                    reasoning: "We need to log in first",
                    questions: ["Are you already logged into GitHub? If not, I'll need your credentials."],
                    isCompleted: false
                };
            }

            return {
                actions: [],
                reasoning: "We need to go to the repositories page",
                nextAction: {
                    type: 'click',
                    params: { selector: 'a[href$="/repositories"], a[data-tab-item="repositories"]' },
                    description: 'Clicking repositories link'
                },
                isCompleted: false
            };
        }

        return {
            actions: [],
            reasoning: "Extracting repository information",
            nextAction: {
                type: 'extractData',
                params: {
                    selectors: {
                        repositories: '.repo-list li, [itemprop="owns"] li',
                        repoNames: 'h3 a[href*="/"], .wb-break-all a[href*="/"]',
                        repoDescriptions: '.repo-list p, .pinned-item-desc',
                        repoStats: '.repo-list-stats, .f6.color-fg-muted.mt-2'
                    }
                },
                description: 'Gathering repository information'
            },
            isCompleted: true
        };
    }

    private async checkIfLoggedIn(): Promise<boolean> {
        const result = await chrome.scripting.executeScript({
            target: { tabId: this.browserTabId },
            func: () => {
                const avatarMenu = document.querySelector('.avatar');
                const signInButton = document.querySelector('a[href^="/login"]');
                return !!avatarMenu && !signInButton;
            }
        });
        
        return result && result[0] && result[0].result ? result[0].result : false;
    }

    private async getCurrentUrl(): Promise<string> {
        const tab = await chrome.tabs.get(this.browserTabId);
        return tab.url || '';
    }

    async executeActionPlan(plan: ActionPlan): Promise<{success: boolean, questions?: string[]}> {
        console.log('Executing plan:', plan.reasoning);
        
        for (const action of plan.actions) {
            console.log(`Executing: ${action.description}`);
            
            try {
                await this.executeAction(action);
                // Wait for any page updates
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Verify action result
                const newState = await this.analyzeCurrentPage();
                const verification = await this.verifyActionResult(action, newState);
                
                if (!verification.success && verification.questions) {
                    return {
                        success: false,
                        questions: verification.questions
                    };
                }
            } catch (error) {
                console.error('Action failed:', error);
                return {
                    success: false,
                    questions: [`Action "${action.description}" failed. What should I try instead?`]
                };
            }
        }
        
        return { success: true };
    }

    private async captureScreenshot(description: string): Promise<string> {
        try {
            const windowInfo = await chrome.windows.getCurrent();
            const dataUrl = await chrome.tabs.captureVisibleTab(windowInfo.id!, {
                format: 'png'
            });
            
            // Add screenshot to findings
            if (!this.pageContext.screenshots) {
                this.pageContext.screenshots = [];
            }
            this.pageContext.screenshots.push({
                timestamp: new Date().toISOString(),
                description,
                data: dataUrl
            });
            
            return dataUrl;
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return '';
        }
    }

    async executeAction(action: any): Promise<void> {
        console.log(`Executing action: ${action.description}`);
        
        // Take screenshot before action
        await this.captureScreenshot(`Before: ${action.description}`);
        
        switch (action.type) {
            case 'navigate':
                await chrome.tabs.update(this.browserTabId, { url: action.params.url });
                await this.waitForPageLoad();
                break;
            
            case 'click':
                await chrome.scripting.executeScript({
                    target: { tabId: this.browserTabId },
                    func: (selector) => {
                        const element = document.querySelector(selector);
                        if (element instanceof HTMLElement) {
                            element.click();
                            return true;
                        }
                        return false;
                    },
                    args: [action.params.selector]
                });
                break;
            
            case 'extractData':
                const data = await chrome.scripting.executeScript({
                    target: { tabId: this.browserTabId },
                    func: (selectors) => {
                        const results: any = {};
                        for (const [key, selector] of Object.entries(selectors)) {
                            const elements = document.querySelectorAll(selector as string);
                            results[key] = Array.from(elements).map(el => ({
                                text: el.textContent?.trim(),
                                href: el instanceof HTMLAnchorElement ? el.href : undefined
                            }));
                        }
                        return results;
                    },
                    args: [action.params.selectors]
                });
                this.pageContext.extractedData = data[0].result;
                break;
        }
        
        // Take screenshot after action
        await this.captureScreenshot(`After: ${action.description}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any animations
    }

    private async verifyActionResult(action: any, newState: PageState): Promise<{
        success: boolean;
        questions?: string[];
    }> {
        // Implement verification logic
        return {
            success: true
        };
    }

    // ... rest of your implementation
} 