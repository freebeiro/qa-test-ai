// Import all dependencies
import { CommandProcessor } from './command_processor.js';
import { BrowserTabManager } from './browser_manager.js';
import { CommandFactory } from './command_factory.js';

// Original class definition in place
class QAInterface {
    constructor() {
        // Initialize components
        this.commandProcessor = new CommandProcessor();
        this.browserTab = new BrowserTabManager();
        this.chatHistory = [];
        
        // Get DOM elements
        this.input = document.querySelector('#command-input');
        this.sendButton = document.querySelector('#send-button');
        this.screenshotDiv = document.querySelector('#screenshot');
        
        if (!this.input || !this.sendButton || !this.screenshotDiv) {
            console.error('❌ Required DOM elements not found');
            return;
        }

        this.setupEventListeners();
        console.log('🔧 QAInterface initialized');
    }

    // Rest of your working QAInterface code...
    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            const command = this.input.value.trim();
            if (command) {
                this.handleCommand(command);
            }
        });

        // Enter key press
        this.input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const command = this.input.value.trim();
                if (command) {
                    this.handleCommand(command);
                }
            }
        });
    }

    addToChatHistory(entry) {
        this.chatHistory.push(entry);
        this.updateChatDisplay();
    }

    updateChatDisplay() {
        this.screenshotDiv.innerHTML = '';
        
        this.chatHistory.forEach((entry, index) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-entry';
            
            // Add command text
            const commandDiv = document.createElement('div');
            commandDiv.className = 'command-text';
            commandDiv.textContent = `> ${entry.command}`;
            messageDiv.appendChild(commandDiv);

            // Add screenshots if any
            if (entry.screenshots && entry.screenshots.length > 0) {
                const screenshotsDiv = document.createElement('div');
                screenshotsDiv.className = 'screenshots-container';
                
                entry.screenshots.forEach((screenshot, idx) => {
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'screenshot-wrapper';
                    
                    const img = document.createElement('img');
                    img.src = screenshot.data;
                    img.alt = `Step ${idx + 1}`;
                    
                    const caption = document.createElement('div');
                    caption.className = 'screenshot-caption';
                    caption.textContent = screenshot.caption || `Step ${idx + 1}`;
                    
                    imgWrapper.appendChild(img);
                    imgWrapper.appendChild(caption);
                    screenshotsDiv.appendChild(imgWrapper);
                });
                
                messageDiv.appendChild(screenshotsDiv);
            }

            // Add any error messages
            if (entry.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = entry.error;
                messageDiv.appendChild(errorDiv);
            }

            this.screenshotDiv.appendChild(messageDiv);
        });

        // Scroll to bottom
        this.screenshotDiv.scrollTop = this.screenshotDiv.scrollHeight;
    }

    async handleCommand(command) {
        const chatEntry = {
            command,
            screenshots: [],
            timestamp: new Date().toISOString()
        };

        try {
            this.disableUI();
            
            const commandData = await this.commandProcessor.processCommand(command);
            if (!commandData) {
                throw new Error('Invalid command');
            }

            const cmd = this.createCommand(commandData);
            if (!cmd) {
                throw new Error('Command creation failed');
            }

            await cmd.execute();
            
            // Capture final screenshot
            const screenshot = await this.browserTab.captureScreenshot();
            if (screenshot) {
                chatEntry.screenshots.push({
                    data: screenshot,
                    caption: 'Result'
                });
            }

        } catch (error) {
            console.error('❌ Command execution failed:', error);
            chatEntry.error = error.message;
        } finally {
            this.addToChatHistory(chatEntry);
            this.enableUI();
            // Clear the input field after command execution
            this.input.value = '';
        }
    }

    disableUI() {
        this.input.disabled = true;
        this.sendButton.disabled = true;
    }

    enableUI() {
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.input.focus();
    }

    createCommand(commandData) {
        return CommandFactory.createCommand(
            commandData.type, 
            commandData.params || commandData, 
            this.browserTab
        );
    }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting QA Testing Assistant...');
    window.qaInterface = new QAInterface();
});