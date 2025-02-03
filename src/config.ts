export const config = {
    llm: {
        endpoint: 'http://localhost:11434/api/generate',
        model: 'deepseek-7b'
    },
    ui: {
        defaultWindowSize: {
            width: 400,
            height: 600
        },
        maxRetries: 3,
        retryDelay: 1000
    },
    commands: {
        availableActions: [
            'navigate',
            'click',
            'type',
            'fill',
            'submit',
            'extract',
            'scroll',
            'wait'
        ]
    }
}; 