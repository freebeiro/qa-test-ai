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
    const resizeObserver = new ResizeObserver(() => this.autoResizeInput());
    resizeObserver.observe(this.input);
  }

  /**
   * Auto-resize the input field based on content
   */
  autoResizeInput() {
    const input = this.input;
    // Reset height to auto to get proper scrollHeight
    input.style.height = 'auto';
    // Get the scrollHeight before setting the new height
    const scrollHeight = input.scrollHeight;
    // Set height based on scrollHeight, capped at 120px
    const newHeight = Math.min(scrollHeight, 120);
    input.style.height = newHeight + 'px';
    input.style.overflowY = newHeight === 120 ? 'auto' : 'hidden';
  }

  /**
   * Submit the current command
   */
  async submitCommand() {
    const command = this.input.value.trim();
    if (command) {
      await this.handleCommand(command);
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
      
      if (!response) {
        throw new Error('No response received from command execution');
      }
      
      if (!response.success) {
        throw new Error(response.error || 'Command execution failed');
      }
      
      if (response.screenshot) {
        chatEntry.screenshots.push({
          data: response.screenshot,
          caption: 'Command Result'
        });
      }
      
      this.chatHistory.addEntry(chatEntry);
    } catch (error) {
      console.error('Command execution failed:', error);
      chatEntry.error = error.message;
      this.chatHistory.addEntry(chatEntry);
    } finally {
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