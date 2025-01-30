const config = {
    // DeepSeek R1 configuration (moved to environment variables file)
    deepseek: {
        // API key should be loaded from chrome.storage or similar
        endpoints: {
            reason: 'https://api.deepseek.com/v1/reason',
            chat: 'https://api.deepseek.com/v1/chat'
        }
    },
    
    // UI-TARS configuration for port 8001
    uiTars: {
        endpoint: 'http://localhost:8001/v1/chat/completions'
    },
    
    // PDF service configuration for port 8002
    pdfService: {
        endpoint: 'http://localhost:8002/generate-pdf'
    },
    
    // Debug mode for detailed logging
    debug: true
};

export default config;