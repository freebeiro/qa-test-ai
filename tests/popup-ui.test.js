// Test file for popup UI components
import '@testing-library/jest-dom';
import { QAInterface } from '../src/ui/popup-ui.js';
import { CommandProcessor } from '../src/commands/index.js';
import { ChatHistory } from '../src/ui/chat-history.js';

// Mock CommandProcessor
jest.mock('../src/commands/index.js', () => ({
  CommandProcessor: jest.fn().mockImplementation(() => ({
    processCommand: jest.fn().mockResolvedValue({ type: 'test_command' })
  }))
}));

// Mock ChatHistory
jest.mock('../src/ui/chat-history.js', () => ({
  ChatHistory: jest.fn().mockImplementation(() => ({
    addEntry: jest.fn(),
    updateDisplay: jest.fn(),
    getHistory: jest.fn().mockReturnValue([]),
    clearHistory: jest.fn()
  }))
}));

describe('QAInterface', () => {
  let qaInterface;
  let mockChromeRuntime;
  let mockResizeObserver;
  
  beforeEach(() => {
    // Set up document body
    document.body.innerHTML = `
      <div id="app">
        <div class="chat-container" id="screenshot"></div>
        <div class="input-group">
          <textarea id="command-input"></textarea>
          <button id="send-button">Send</button>
        </div>
      </div>
    `;
    
    // Mock chrome.runtime.sendMessage
    mockChromeRuntime = {
      sendMessage: jest.fn().mockResolvedValue({ success: true, screenshot: 'data:image/png;base64,abc123' })
    };
    global.chrome = { runtime: mockChromeRuntime };
    
    // Mock ResizeObserver with proper spy functionality
    mockResizeObserver = {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    };
    global.ResizeObserver = jest.fn(() => mockResizeObserver);
    
    // Initialize QAInterface
    qaInterface = new QAInterface();
    
    // Mock scrollHeight for input element
    Object.defineProperty(qaInterface.input, 'scrollHeight', {
      configurable: true,
      value: 50
    });
    
    // Don't mock autoResizeInput initially
    qaInterface.autoResizeInput = qaInterface.autoResizeInput.bind(qaInterface);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with UI elements and command processor', () => {
      expect(qaInterface.input).toBe(document.querySelector('#command-input'));
      expect(qaInterface.sendButton).toBe(document.querySelector('#send-button'));
      expect(qaInterface.screenshotDiv).toBe(document.querySelector('#screenshot'));
      expect(CommandProcessor).toHaveBeenCalled();
      expect(ChatHistory).toHaveBeenCalled();
    });
    
    it('should set up event listeners', () => {
      // Verify event listeners were set up during initialization
      const addEventListenerSpy = jest.spyOn(qaInterface.sendButton, 'addEventListener');
      
      // Call setupEventListeners again (it was already called in constructor)
      qaInterface.setupEventListeners();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
    
    it('should set up auto-resize', () => {
      expect(mockResizeObserver.observe).toHaveBeenCalledWith(qaInterface.input);
    });

    it('should initialize on DOMContentLoaded', () => {
      // Mock window.qaInterface
      delete window.qaInterface;
      
      // Create a spy on QAInterface constructor
      const originalQAInterface = global.QAInterface;
      global.QAInterface = jest.fn();
      
      // Trigger DOMContentLoaded event
      const domContentLoadedEvent = new Event('DOMContentLoaded');
      document.dispatchEvent(domContentLoadedEvent);
      
      // Restore original QAInterface
      global.QAInterface = originalQAInterface;
    });
  });
  
  describe('Command Submission', () => {
    it('should process command on submitCommand', async () => {
      qaInterface.input.value = 'type hello';
      
      // Mock handleCommand to resolve immediately to avoid async issues
      const originalHandleCommand = qaInterface.handleCommand;
      qaInterface.handleCommand = jest.fn().mockImplementation(async (cmd) => {
        await originalHandleCommand.call(qaInterface, cmd);
      });
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).toHaveBeenCalledWith('type hello');
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'EXECUTE_COMMAND',
        command: { type: 'test_command' }
      });
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalled();
    });
    
    it('should handle command execution errors', async () => {
      qaInterface.input.value = 'bad command';
      mockChromeRuntime.sendMessage.mockRejectedValueOnce(new Error('Command failed'));
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Command failed' })
      );
    });

    it('should handle null command data', async () => {
      qaInterface.input.value = 'unknown command';
      qaInterface.commandProcessor.processCommand.mockResolvedValueOnce(null);
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unknown command' })
      );
    });

    it('should handle unsuccessful response', async () => {
      qaInterface.input.value = 'failing command';
      mockChromeRuntime.sendMessage.mockResolvedValueOnce({ success: false, error: 'Execution error' });
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Execution error' })
      );
    });

    it('should handle response with screenshot', async () => {
      qaInterface.input.value = 'screenshot command';
      mockChromeRuntime.sendMessage.mockResolvedValueOnce({ 
        success: true, 
        screenshot: 'data:image/png;base64,testscreenshot' 
      });
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ 
          screenshots: [{
            data: 'data:image/png;base64,testscreenshot',
            caption: 'Command Result'
          }]
        })
      );
    });
    
    it('should not process empty commands', async () => {
      qaInterface.input.value = '  ';
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).not.toHaveBeenCalled();
      expect(mockChromeRuntime.sendMessage).not.toHaveBeenCalled();
    });
    
    it('should handle Enter key press', () => {
      // Create spy on submitCommand
      const submitCommandSpy = jest.spyOn(qaInterface, 'submitCommand').mockImplementation();
      
      // Trigger keydown event on input
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      qaInterface.input.dispatchEvent(keydownEvent);
      
      expect(submitCommandSpy).toHaveBeenCalled();
      submitCommandSpy.mockRestore();
    });
    
    it('should not trigger submitCommand on Enter with Shift', () => {
      // Create spy on submitCommand
      const submitCommandSpy = jest.spyOn(qaInterface, 'submitCommand').mockImplementation();
      
      // Trigger keydown event on input with Shift
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
      qaInterface.input.dispatchEvent(keydownEvent);
      
      expect(submitCommandSpy).not.toHaveBeenCalled();
      submitCommandSpy.mockRestore();
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
    
    it('should auto-resize input field based on content', () => {
      // Test with small content
      Object.defineProperty(qaInterface.input, 'scrollHeight', { value: 50 });
      
      // Manually set the style properties for testing
      qaInterface.input.style.height = '0px';
      qaInterface.input.style.overflowY = '';
      
      // Call the method
      qaInterface.autoResizeInput();
      
      expect(qaInterface.input.style.height).toBe('50px');
      expect(qaInterface.input.style.overflowY).toBe('hidden');
    });
    
    it('should cap input height for long content', () => {
      // Test with large content
      Object.defineProperty(qaInterface.input, 'scrollHeight', { value: 150 });
      
      // Manually set the style properties for testing
      qaInterface.input.style.height = '0px';
      qaInterface.input.style.overflowY = '';
      
      // Call the method
      qaInterface.autoResizeInput();
      
      expect(qaInterface.input.style.height).toBe('120px');
      expect(qaInterface.input.style.overflowY).toBe('auto');
    });
    
    it('should trigger auto-resize on input events', () => {
      // Mock autoResizeInput for this test
      qaInterface.autoResizeInput = jest.fn();
      
      // Test the input event listener
      const inputEvent = new Event('input');
      qaInterface.input.dispatchEvent(inputEvent);
      
      expect(qaInterface.autoResizeInput).toHaveBeenCalled();
    });
  });
});