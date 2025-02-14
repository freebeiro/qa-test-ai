import CommandProcessor from './core/command_processor.js';
import BrowserTabManager from './core/browser_tab_manager.js';
import UIManager from './core/ui_manager.js';
import CommandParser from './core/command_parser.js';
import CommandFactory from './core/command_factory.js';

class QAInterface {
    constructor() {
        // Initialize components
        this.commandProcessor = new CommandProcessor();
        this.browserTab = new BrowserTabManager();
        this.chatHistory = [];
        this.isProcessing = false;
        
        // Get DOM elements
        this.input = document.querySelector('#command-input');
        this.sendButton = document.querySelector('#send-button');
        this.chatContainer = document.querySelector('#screenshot');
        
        if (!this.input || !this.sendButton || !this.chatContainer) {
            console.error('❌ Required DOM elements not found');
            return;
        }

        // Initialize UI Manager
        this.ui = new UIManager({
            input: this.input,
            sendButton: this.sendButton,
            chat: this.chatContainer
        });

        this.setupEventListeners();
        this.loadChatHistory();
        console.log('🔧 QAInterface initialized');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', async () => {
            await this.handleSendCommand();
        });

        // Enter key press
        this.input.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                await this.handleSendCommand();
            }
        });

        // Auto-resize input
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
        });
    }

    async handleSendCommand() {
        const command = this.input.value.trim();
        if (command && !this.isProcessing) {
            await this.handleCommand(command);
        }
    }

    loadChatHistory() {
        chrome.storage.local.get(['chatHistory'], (result) => {
            if (result.chatHistory) {
                this.chatHistory = result.chatHistory;
                this.updateChatDisplay();
            }
        });
    }

    saveChatHistory() {
        chrome.storage.local.set({ chatHistory: this.chatHistory });
    }

    addToChatHistory(entry) {
        this.chatHistory.push(entry);
        this.saveChatHistory();
        this.updateChatDisplay();
    }

    updateChatDisplay() {
        this.chatContainer.innerHTML = '';
        
        this.chatHistory.forEach((entry) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-entry';
            
            // Command text
            const commandDiv = document.createElement('div');
            commandDiv.className = 'command-text';
            commandDiv.textContent = `> ${entry.command}`;
            messageDiv.appendChild(commandDiv);

            // Screenshots
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

            // Error messages
            if (entry.error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = entry.error;
                messageDiv.appendChild(errorDiv);
            }

            this.chatContainer.appendChild(messageDiv);
        });

        // Scroll to bottom
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    async handleCommand(command) {
        this.isProcessing = true;
        const chatEntry = {
            command,
            screenshots: [],
            timestamp: new Date().toISOString()
        };

        try {
            this.disableUI();
            
            // Initial screenshot
            const initialScreenshot = await this.browserTab.captureScreenshot();
            if (initialScreenshot) {
                chatEntry.screenshots.push({
                    data: initialScreenshot,
                    caption: 'Before command execution'
                });
            }

            // Process command
            const commandData = await this.commandProcessor.processCommand(command);
            if (!commandData) {
                throw new Error('Invalid command');
            }

            // Create and execute command
            const cmd = this.createCommand(commandData);
            if (!cmd) {
                throw new Error('Command creation failed');
            }

            await cmd.execute();
            
            // Final screenshot
            const finalScreenshot = await this.browserTab.captureScreenshot();
            if (finalScreenshot) {
                chatEntry.screenshots.push({
                    data: finalScreenshot,
                    caption: 'After command execution'
                });
            }

        } catch (error) {
            console.error('❌ Command execution failed:', error);
            chatEntry.error = error.message;
        } finally {
            this.addToChatHistory(chatEntry);
            this.enableUI();
            this.input.value = '';
            this.input.style.height = 'auto';
            this.isProcessing = false;
        }
    }

    disableUI() {
        this.ui.toggleControls(false);
        this.sendButton.disabled = true;
    }

    enableUI() {
        this.ui.toggleControls(true);
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

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing QA Interface');
    new QAInterface();
});