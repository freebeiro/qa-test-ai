const config = {
    // DeepSeek R1 configuration
    deepseek: {
        apiKey: 'sk-efa7452956d74dc0b562792594062c17',
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