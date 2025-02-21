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
        this.setupAutoResize();
        console.log('🔧 QAInterface initialized');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.submitCommand();
        });

        // Enter key press (without shift)
        this.input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.submitCommand();
            }
        });

        // Input changes for auto-resize
        this.input.addEventListener('input', () => {
            this.autoResizeInput();
        });
    }

    setupAutoResize() {
        // Set initial height
        this.autoResizeInput();
        
        // Observe window resize
        new ResizeObserver(() => {
            this.autoResizeInput();
        }).observe(this.input);
    }

    autoResizeInput() {
        const input = this.input;
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
        
        // Limit max height
        if (input.scrollHeight > 120) {
            input.style.height = '120px';
            input.style.overflowY = 'auto';
        } else {
            input.style.overflowY = 'hidden';
        }
    }

    submitCommand() {
        const command = this.input.value.trim();
        if (command) {
            this.handleCommand(command);
            this.input.value = '';
            this.autoResizeInput();
        }
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
                    const wrapper = document.createElement('div');
                    wrapper.className = 'screenshot-wrapper';
                    
                    // Create image
                    const img = document.createElement('img');
                    img.src = screenshot.data;
                    img.alt = `Step ${idx + 1}`;
                    
                    // Add click handler for fullscreen
                    img.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
                    
                    // Add controls
                    const controls = document.createElement('div');
                    controls.className = 'screenshot-controls';
                    
                    const zoomButton = document.createElement('button');
                    zoomButton.textContent = '🔍 View Full Size';
                    zoomButton.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
                    controls.appendChild(zoomButton);
                    
                    // Add caption
                    const caption = document.createElement('div');
                    caption.className = 'screenshot-caption';
                    caption.textContent = screenshot.caption || `Step ${idx + 1}`;
                    
                    wrapper.appendChild(img);
                    wrapper.appendChild(controls);
                    wrapper.appendChild(caption);
                    screenshotsDiv.appendChild(wrapper);
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

    showFullscreenImage(imageUrl) {
        const fullscreenDiv = document.createElement('div');
        fullscreenDiv.className = 'screenshot-fullscreen';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => fullscreenDiv.remove());
        
        // Close on background click
        fullscreenDiv.addEventListener('click', (e) => {
            if (e.target === fullscreenDiv) {
                fullscreenDiv.remove();
            }
        });
        
        fullscreenDiv.appendChild(img);
        fullscreenDiv.appendChild(closeButton);
        document.body.appendChild(fullscreenDiv);
    }

    async handleCommand(command) {
        const chatEntry = {
            command,
            screenshots: [],
            timestamp: new Date().toISOString()
        };

        try {
            this.disableUI();
            
            // Process command to get structured data
            const commandData = await this.commandProcessor.processCommand(command);
            if (!commandData) {
                throw new Error('Invalid command');
            }

            console.log('Executing command:', commandData);

            // Execute the command based on its type
            switch (commandData.type) {
                case 'navigation':
                    await this.browserTab.navigate(commandData.url);
                    break;
                case 'back':
                    await this.browserTab.executeScript(() => window.history.back());
                    break;
                case 'forward':
                    await this.browserTab.executeScript(() => window.history.forward());
                    break;
                case 'refresh':
                    await this.browserTab.executeScript(() => window.location.reload());
                    break;
                case 'scroll':
                    await this.browserTab.executeScript((direction) => {
                        window.scrollBy(0, direction === 'down' ? 300 : -300);
                    }, [commandData.direction]);
                    break;
                case 'search':
                    const searchUrl = commandData.engine === 'google' 
                        ? `https://www.google.com/search?q=${encodeURIComponent(commandData.query)}`
                        : `https://www.google.com/search?q=${encodeURIComponent(commandData.query)}`;
                    await this.browserTab.navigate(searchUrl);
                    break;
                default:
                    // For other commands, send to background script
                    const response = await chrome.runtime.sendMessage({
                        type: 'EXECUTE_COMMAND',
                        command: commandData
                    });

                    if (!response.success) {
                        throw new Error(response.error || 'Command execution failed');
                    }

                    if (response.screenshot) {
                        chatEntry.screenshots.push({
                            data: response.screenshot,
                            caption: 'Command Result'
                        });
                    }
            }

            // Capture screenshot after command execution
            try {
                const screenshot = await this.browserTab.captureScreenshot();
                if (screenshot) {
                    chatEntry.screenshots.push({
                        data: screenshot,
                        caption: 'Command Result'
                    });
                }
            } catch (error) {
                console.error('Screenshot capture failed:', error);
            }

        } catch (error) {
            console.error('❌ Command execution failed:', error);
            chatEntry.error = error.message;
        } finally {
            this.addToChatHistory(chatEntry);
            this.enableUI();
            this.input.value = '';
            this.autoResizeInput();
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
