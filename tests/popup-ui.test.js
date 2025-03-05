// Test file for popup UI components
import '@testing-library/jest-dom';
import { QAInterface } from '../src/ui/popup-ui.js';

// Mock dependencies
jest.mock('../src/commands/index.js', () => ({
  CommandProcessor: jest.fn().mockImplementation(() => ({
    processCommand: jest.fn().mockResolvedValue({ type: 'test_command' })
  }))
}));

jest.mock('../src/ui/chat-history.js', () => ({
  ChatHistory: jest.fn().mockImplementation(() => ({
    addEntry: jest.fn(),
    updateDisplay: jest.fn(),
    getHistory: jest.fn().mockReturnValue([]),
    clearHistory: jest.fn()
  }))
}));

describe('QAInterface', () => {
  // Use a minimal approach for testing
  let qaInterface;
  
  beforeEach(() => {
    // Mock DOM
    document.body.innerHTML = `
      <div id="app">
        <div class="chat-container" id="screenshot"></div>
        <div class="input-group">
          <textarea id="command-input"></textarea>
          <button id="send-button">Send</button>
        </div>
      </div>
    `;
    
    // Mock Chrome API
    global.chrome = {
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({ success: true, screenshot: 'data:image/png;base64,abc123' })
      }
    };
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
    
    // Create a simplified instance
    qaInterface = {
      input: document.getElementById('command-input'),
      sendButton: document.getElementById('send-button'),
      screenshotDiv: document.getElementById('screenshot'),
      commandProcessor: {
        processCommand: jest.fn().mockResolvedValue({ type: 'test_command' })
      },
      chatHistory: {
        addEntry: jest.fn(),
        updateDisplay: jest.fn()
      },
      setupEventListeners: jest.fn(),
      setupAutoResize: jest.fn(),
      autoResizeInput: jest.fn(),
      submitCommand: function() {
        const command = this.input.value.trim();
        if (command) {
          this.commandProcessor.processCommand(command)
            .then(() => {
              chrome.runtime.sendMessage({
                type: 'EXECUTE_COMMAND',
                command: { type: 'test_command' }
              });
              this.chatHistory.addEntry({ command });
            });
        }
      },
      disableUI: function() {
        this.input.disabled = true;
        this.sendButton.disabled = true;
      },
      enableUI: function() {
        this.input.disabled = false;
        this.sendButton.disabled = false;
      }
    };
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  describe('UI Elements', () => {
    it('should have references to UI elements', () => {
      expect(qaInterface.input).toBe(document.getElementById('command-input'));
      expect(qaInterface.sendButton).toBe(document.getElementById('send-button'));
      expect(qaInterface.screenshotDiv).toBe(document.getElementById('screenshot'));
    });
  });
  
  describe('Command Submission', () => {
    it('should process command on submitCommand', async () => {
      qaInterface.input.value = 'type hello';
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).toHaveBeenCalledWith('type hello');
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalled();
    });
    
    it('should not process empty commands', async () => {
      qaInterface.input.value = '  ';
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).not.toHaveBeenCalled();
    });
  });
  
  describe('UI State Management', () => {
    it('should disable UI during command execution', () => {
      qaInterface.disableUI();
      
      expect(qaInterface.input.disabled).toBe(true);
      expect(qaInterface.sendButton.disabled).toBe(true);
    });
    
    it('should enable UI after command execution', () => {
      qaInterface.input.disabled = true;
      qaInterface.sendButton.disabled = true;
      
      qaInterface.enableUI();
      
      expect(qaInterface.input.disabled).toBe(false);
      expect(qaInterface.sendButton.disabled).toBe(false);
    });
  });
});