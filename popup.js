import { CommandProcessor } from './command_processor.js';

class QAInterface {
  constructor() {
    this.commandProcessor = new CommandProcessor();
    this.chatHistory = [];
    
    this.input = document.querySelector('#command-input');
    this.sendButton = document.querySelector('#send-button');
    this.screenshotDiv = document.querySelector('#screenshot');
    
    this.setupEventListeners();
    this.setupAutoResize();
    console.log('QA Interface initialized');
  }

  setupEventListeners() {
    this.sendButton.addEventListener('click', () => this.submitCommand());
    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.submitCommand();
      }
    });
    this.input.addEventListener('input', () => this.autoResizeInput());
  }

  setupAutoResize() {
    this.autoResizeInput();
    new ResizeObserver(() => this.autoResizeInput()).observe(this.input);
  }

  autoResizeInput() {
    const input = this.input;
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
    
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

  async handleCommand(command) {
    const chatEntry = { command, screenshots: [], timestamp: new Date().toISOString() };
    
    try {
      this.disableUI();
      const commandData = await this.commandProcessor.processCommand(command);
      
      if (!commandData) {
        throw new Error('Unknown command');
      }
      
      console.log('Executing command:', commandData);
      
      const response = await chrome.runtime.sendMessage({
        type: 'EXECUTE_COMMAND',
        command: commandData
      });
      
      if (!response?.success) {
        throw new Error(response?.error || 'Command execution failed');
      }
      
      if (response.screenshot) {
        chatEntry.screenshots.push({
          data: response.screenshot,
          caption: 'Command Result'
        });
      }
    } catch (error) {
      console.error('Command execution failed:', error);
      chatEntry.error = error.message;
    } finally {
      this.addToChatHistory(chatEntry);
      this.enableUI();
    }
  }

  addToChatHistory(entry) {
    this.chatHistory.push(entry);
    this.updateChatDisplay();
  }

  updateChatDisplay() {
    this.screenshotDiv.innerHTML = '';
    
    this.chatHistory.forEach(entry => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-entry';
      
      const commandDiv = document.createElement('div');
      commandDiv.className = 'command-text';
      commandDiv.textContent = `> ${entry.command}`;
      messageDiv.appendChild(commandDiv);

      if (entry.screenshots && entry.screenshots.length > 0) {
        const screenshotsDiv = document.createElement('div');
        screenshotsDiv.className = 'screenshots-container';
        
        entry.screenshots.forEach((screenshot, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'screenshot-wrapper';
          
          const img = document.createElement('img');
          img.src = screenshot.data;
          img.alt = `Screenshot ${idx + 1}`;
          img.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
          
          const controls = document.createElement('div');
          controls.className = 'screenshot-controls';
          
          const zoomButton = document.createElement('button');
          zoomButton.textContent = '🔍 View Full Size';
          zoomButton.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
          controls.appendChild(zoomButton);
          
          wrapper.appendChild(img);
          wrapper.appendChild(controls);
          screenshotsDiv.appendChild(wrapper);
        });
        
        messageDiv.appendChild(screenshotsDiv);
      }

      if (entry.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = entry.error;
        messageDiv.appendChild(errorDiv);
      }

      this.screenshotDiv.appendChild(messageDiv);
    });

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
    
    fullscreenDiv.addEventListener('click', e => {
      if (e.target === fullscreenDiv) fullscreenDiv.remove();
    });
    
    fullscreenDiv.appendChild(img);
    fullscreenDiv.appendChild(closeButton);
    document.body.appendChild(fullscreenDiv);
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
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Starting QA Testing Assistant...');
  window.qaInterface = new QAInterface();
});
