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
    
    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }));
    
    // Initialize QAInterface
    qaInterface = new QAInterface();
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
      const addEventListenerSpy = jest.spyOn(qaInterface.sendButton, 'addEventListener');
      qaInterface.setupEventListeners();
      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });
  
  describe('Command Submission', () => {
    it('should process command on submitCommand', async () => {
      qaInterface.input.value = 'type hello';
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).toHaveBeenCalledWith('type hello');
      expect(mockChromeRuntime.sendMessage).toHaveBeenCalledWith({
        type: 'EXECUTE_COMMAND',
        command: { type: 'test_command' }
      });
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalled();
    });
    
    it('should not process empty commands', async () => {
      qaInterface.input.value = '  ';
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.commandProcessor.processCommand).not.toHaveBeenCalled();
      expect(mockChromeRuntime.sendMessage).not.toHaveBeenCalled();
    });
    
    it('should handle Enter key press', () => {
      const submitCommandSpy = jest.spyOn(qaInterface, 'submitCommand');
      const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      
      qaInterface.input.dispatchEvent(keydownEvent);
      
      expect(submitCommandSpy).toHaveBeenCalled();
    });
    
    it('should handle command execution errors', async () => {
      qaInterface.input.value = 'bad command';
      mockChromeRuntime.sendMessage.mockResolvedValueOnce({ 
        success: false, 
        error: 'Command failed' 
      });
      
      await qaInterface.submitCommand();
      
      expect(qaInterface.chatHistory.addEntry).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Command failed' })
      );
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
      // Mock scrollHeight
      Object.defineProperty(qaInterface.input, 'scrollHeight', { value: 50 });
      
      qaInterface.autoResizeInput();
      
      expect(qaInterface.input.style.height).toBe('50px');
      expect(qaInterface.input.style.overflowY).toBe('hidden');
    });
    
    it('should cap input height for long content', () => {
      // Mock scrollHeight
      Object.defineProperty(qaInterface.input, 'scrollHeight', { value: 150 });
      
      qaInterface.autoResizeInput();
      
      expect(qaInterface.input.style.height).toBe('120px');
      expect(qaInterface.input.style.overflowY).toBe('auto');
    });
  });
});