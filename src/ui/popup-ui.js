import { CommandProcessor } from '../commands/index.js';
import { ChatHistory } from './chat-history.js';

/**
 * Class to manage the QA Interface UI
 */
export class QAInterface {
  /**
   * Initialize the QA Interface
   */
  constructor() {
    this.commandProcessor = new CommandProcessor();
    
    // Initialize UI elements
    this.input = document.querySelector('#command-input');
    this.sendButton = document.querySelector('#send-button');
    this.screenshotDiv = document.querySelector('#screenshot');
    
    // Initialize chat history
    this.chatHistory = new ChatHistory(this.screenshotDiv);
    
    this.setupEventListeners();
    this.setupAutoResize();
    console.log('QA Interface initialized');
  }

  /**
   * Set up event listeners for UI elements
   */
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

  /**
   * Set up auto-resize for the input field
   */
  setupAutoResize() {
    this.autoResizeInput();
    new ResizeObserver(() => this.autoResizeInput()).observe(this.input);
  }

  /**
   * Auto-resize the input field based on content
   */
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

  /**
   * Submit the current command
   */
  submitCommand() {
    const command = this.input.value.trim();
    if (command) {
      this.handleCommand(command);
      this.input.value = '';
      this.autoResizeInput();
    }
  }

  /**
   * Handle a command
   * @param {string} command - The command to handle
   */
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
      this.chatHistory.addEntry(chatEntry);
      this.enableUI();
    }
  }

  /**
   * Disable UI elements during command execution
   */
  disableUI() {
    this.input.disabled = true;
    this.sendButton.disabled = true;
  }

  /**
   * Enable UI elements after command execution
   */
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