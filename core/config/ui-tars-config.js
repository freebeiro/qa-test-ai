/**
 * UI-TARS Configuration
 */

export const UI_TARS_CONFIG = {
    baseUrl: 'http://localhost:11434',  // Ollama default port
    model: 'ui-tars',
    maxRetries: 3,
    timeout: 30000,  // 30 seconds timeout
    
    // Visual processing settings
    screenshot: {
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'jpeg'
    },
    
    // Command processing settings
    commands: {
        maxTokens: 1024,
        temperature: 0.7,
        topP: 0.9
    }
};

export default UI_TARS_CONFIG;