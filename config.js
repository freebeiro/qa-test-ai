const config = {
    // DeepSeek R1 configuration
    deepseek: {
        apiKey: 'sk-efa7452956d74dc0b562792594062c17',
        endpoints: {
            reason: 'https://api.deepseek.com/v1/reason',
            chat: 'https://api.deepseek.com/v1/chat'
        }
    },
    
    // UI-TARS configuration
    uiTars: {
        endpoint: 'http://localhost:8000/v1/chat/completions'
    },
    
    // Debug mode for detailed logging
    debug: true
};

export default config;