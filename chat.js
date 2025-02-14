import CommandProcessor from './core/command_processor.js';
import BrowserTabManager from './core/browser_tab_manager.js';
import UIManager from './core/ui_manager.js';

class QAInterface {
    constructor() {
        this.init();
    }

    init() {
        // Initialize components
        this.browserTab = new BrowserTabManager();
        this.commandProcessor = new CommandProcessor();
        
        // Initialize UI
        this.initUI();
        
        console.log('QA Interface initialized');
    }

    initUI() {
        // Get DOM elements
        const elements = {
            input: document.getElementById('command-input'),
            sendButton: document.getElementById('send-button'),
            chat: document.getElementById('chat-history')
        };

        // Check for required elements
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                throw new Error(`Required element not found: ${key}`);
            }
        }

        // Initialize UI Manager
        this.ui = new UIManager(elements);

        // Setup event listeners
        elements.sendButton.addEventListener('click', () => this.handleCommand());
        elements.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleCommand();
            }
        });
    }

    async handleCommand() {
        const commandText = this.ui.getInputValue();
        if (!commandText || this.ui.isProcessing) return;

        try {
            this.ui.setProcessing(true);

            // Process command
            const commandData = await this.commandProcessor.processCommand(commandText);
            if (!commandData) {
                throw new Error('Invalid command');
            }

            // Execute command
            const result = await this.browserTab.executeCommand(commandData);
            
            // Create chat entry with screenshots
            const chatEntry = {
                command: commandText,
                timestamp: new Date().toISOString()
            };

            if (result.screenshots) {
                chatEntry.screenshots = [
                    {
                        data: result.screenshots.before,
                        caption: 'Before command'
                    },
                    {
                        data: result.screenshots.after,
                        caption: 'After command'
                    }
                ].filter(s => s.data); // Filter out null screenshots
            }

            // Add success message
            this.ui.addMessage(chatEntry);

        } catch (error) {
            console.error('Command execution failed:', error);
            this.ui.addMessage({
                command: commandText,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        } finally {
            this.ui.setProcessing(false);
            this.ui.clearInput();
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.qaInterface = new QAInterface();
    } catch (error) {
        console.error('Failed to initialize QA Interface:', error);
        // Display error in UI if possible
        const chat = document.getElementById('chat-history');
        if (chat) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'chat-entry error-message';
            errorDiv.textContent = `Initialization failed: ${error.message}`;
            chat.appendChild(errorDiv);
        }
    }
});