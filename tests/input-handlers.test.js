// Test file for input handlers
import { 
  getInputSelectionScript, 
  handleTypingCommand, 
  getPressEnterScript, 
  handlePressEnterCommand 
} from '../src/commands/input-handlers.js';

// Mock Chrome API and utils
jest.mock('../src/utils/index.js', () => {
  return {
    getActiveTab: jest.fn().mockResolvedValue({ id: 123 }),
    formatError: jest.fn(error => ({ success: false, error: error.message })),
    chromeAPI: {
      scripting: {
        executeScript: jest.fn().mockResolvedValue([{result: {success: true}}])
      },
      tabs: {
        sendMessage: jest.fn().mockResolvedValue({success: true})
      }
    }
  };
});

describe('Input Handlers', () => {
  const utils = require('../src/utils/index.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getInputSelectionScript', () => {
    it('should return script with correct text argument', () => {
      const text = 'Test input';
      const script = getInputSelectionScript(text);
      
      expect(script.args).toEqual([text]);
      expect(typeof script.function).toBe('function');
    });
    
    it('should generate a function that handles various input types', () => {
      const text = 'Test input';
      const script = getInputSelectionScript(text);
      
      // Create a mock DOM environment
      document.body.innerHTML = `
        <input type="text" id="text-input">
        <textarea id="textarea"></textarea>
        <div contenteditable="true" id="contenteditable"></div>
      `;
      
      // Mock focus and event dispatching
      const mockFocus = jest.fn();
      const mockDispatchEvent = jest.fn();
      
      // Test with active element being an input
      const textInput = document.getElementById('text-input');
      textInput.focus = mockFocus;
      textInput.dispatchEvent = mockDispatchEvent;
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        get: jest.fn(() => textInput),
        configurable: true
      });
      
      // Run the script function
      const result = script.function(text);
      
      expect(mockFocus).toHaveBeenCalled();
      expect(textInput.value).toBe(text);
      expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      
      // Clean up
      document.body.innerHTML = '';
    });

    it('should handle case when no input is found', () => {
      const text = 'Test input';
      const script = getInputSelectionScript(text);
      
      // Create empty DOM environment
      document.body.innerHTML = '';
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        get: jest.fn(() => null),
        configurable: true
      });
      
      // Run the script function
      const result = script.function(text);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No input found');
    });

    it('should handle hidden inputs', () => {
      const text = 'Test input';
      const script = getInputSelectionScript(text);
      
      // Create DOM with hidden input
      document.body.innerHTML = `
        <input type="text" id="hidden-input" style="display: none">
      `;
      
      // Run the script function
      const result = script.function(text);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('No input found');
      
      // Clean up
      document.body.innerHTML = '';
    });

    it('should handle contenteditable elements', () => {
      const text = 'Test input';
      const script = getInputSelectionScript(text);
      
      // Create DOM with contenteditable div
      document.body.innerHTML = `
        <div id="content" contenteditable="true"></div>
      `;
      
      const div = document.getElementById('content');
      const mockDispatchEvent = jest.fn();
      div.dispatchEvent = mockDispatchEvent;
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        get: jest.fn(() => div),
        configurable: true
      });
      
      // Run the script function
      const result = script.function(text);
      
      expect(div.textContent).toBe(text);
      expect(mockDispatchEvent).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      
      // Clean up
      document.body.innerHTML = '';
    });
  });
  
  describe('handleTypingCommand', () => {
    it('should execute script for generic input commands', async () => {
      const command = { type: 'input', text: 'test text' };
      const tabId = 123;
      
      const result = await handleTypingCommand(command, tabId);
      
      expect(utils.getActiveTab).toHaveBeenCalledWith(tabId);
      expect(utils.chromeAPI.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        function: expect.any(Function),
        args: ['test text']
      });
      expect(result.success).toBe(true);
    });
    
    it('should send message for targeted input commands', async () => {
      const command = { 
        type: 'input_targeted', 
        text: 'test text', 
        target: 'search field' 
      };
      const tabId = 123;
      
      const result = await handleTypingCommand(command, tabId);
      
      expect(utils.getActiveTab).toHaveBeenCalledWith(tabId);
      expect(utils.chromeAPI.tabs.sendMessage).toHaveBeenCalledWith(
        tabId,
        {
          type: 'TYPE_TARGETED',
          text: 'test text',
          target: 'search field'
        }
      );
      expect(result.success).toBe(true);
    });
    
    it('should handle errors when no browser tab is provided', async () => {
      const command = { type: 'input', text: 'test text' };
      const tabId = null;
      
      const result = await handleTypingCommand(command, tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("No browser tab is being controlled");
    });
    
    it('should handle script execution errors', async () => {
      const command = { type: 'input', text: 'test text' };
      const tabId = 123;
      const error = new Error('Script execution failed');
      
      utils.chromeAPI.scripting.executeScript.mockRejectedValueOnce(error);
      
      const result = await handleTypingCommand(command, tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Script execution failed');
    });
  });
  
  describe('getPressEnterScript', () => {
    it('should return a script that dispatches an Enter key event', () => {
      const script = getPressEnterScript();
      
      expect(typeof script.function).toBe('function');
      
      // Create mock DOM
      document.body.innerHTML = '<input id="test-input">';
      const input = document.getElementById('test-input');
      
      // Mock dispatchEvent
      const mockDispatchEvent = jest.fn();
      input.dispatchEvent = mockDispatchEvent;
      // Mock document.activeElement
      Object.defineProperty(document, 'activeElement', {
        get: jest.fn(() => input),
        configurable: true
      });
      
      // Run script
      const result = script.function();
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(KeyboardEvent));
      expect(result.success).toBe(true);
      
      // Clean up
      document.body.innerHTML = '';
    });
  });
  
  describe('handlePressEnterCommand', () => {
    it('should execute the press enter script', async () => {
      const tabId = 123;
      
      const result = await handlePressEnterCommand(tabId);
      
      expect(utils.chromeAPI.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId },
        function: expect.any(Function)
      });
      expect(result.success).toBe(true);
    });
    
    it('should handle script execution errors', async () => {
      const tabId = 123;
      const error = new Error('Script execution failed');
      
      utils.chromeAPI.scripting.executeScript.mockRejectedValueOnce(error);
      
      const result = await handlePressEnterCommand(tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Script execution failed');
    });
  });
});