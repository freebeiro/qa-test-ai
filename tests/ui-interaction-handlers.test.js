// Test file for UI interaction handlers
import { formatError } from '../src/utils/index.js';
import { 
  getScrollScript, 
  handleScrollCommand, 
  handleClickCommand 
} from '../src/commands/ui-interaction-handlers.js';

// Mock Chrome API
jest.mock('../src/utils/chrome-api.js', () => {
  return {
    __esModule: true,
    default: {
      scripting: {
        executeScript: jest.fn().mockResolvedValue([{result: {success: true}}])
      },
      tabs: {
        sendMessage: jest.fn().mockResolvedValue({success: true})
      }
    }
  };
});

describe('UI Interaction Handlers', () => {
  describe('getScrollScript', () => {
    it('should return script with correct amount', () => {
      const amount = 100;
      const script = getScrollScript(amount);
      
      expect(script.args).toEqual([amount]);
      expect(typeof script.function).toBe('function');
    });
    
    it('should generate function that calls window.scrollBy', () => {
      // We can test the generated function by mocking window.scrollBy
      const originalScrollBy = window.scrollBy;
      
      try {
        const scrollByMock = jest.fn();
        window.scrollBy = scrollByMock;
        
        const script = getScrollScript(100);
        script.function(100); // Execute the function with 100
        
        expect(scrollByMock).toHaveBeenCalledWith(0, 100);
      } finally {
        window.scrollBy = originalScrollBy; // Restore original
      }
    });
  });
  
  describe('handleScrollCommand', () => {
    const chromeAPI = require('../src/utils/chrome-api.js').default;
    const browserTabId = 123;
    
    beforeEach(() => {
      chromeAPI.scripting.executeScript.mockClear();
    });
    
    it('should call executeScript with correct parameters', async () => {
      const command = { type: 'scroll', amount: 100 };
      
      const result = await handleScrollCommand(command, browserTabId);
      
      expect(chromeAPI.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: browserTabId },
        function: expect.any(Function),
        args: [100]
      });
      expect(result.success).toBe(true);
    });
    
    it('should handle errors correctly', async () => {
      const command = { type: 'scroll', amount: 100 };
      const error = new Error('Test error');
      
      chromeAPI.scripting.executeScript.mockRejectedValueOnce(error);
      
      const result = await handleScrollCommand(command, browserTabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
  
  describe('handleClickCommand', () => {
    const chromeAPI = require('../src/utils/chrome-api.js').default;
    const browserTabId = 123;
    
    beforeEach(() => {
      chromeAPI.tabs.sendMessage.mockClear();
    });
    
    it('should send message to content script with correct parameters', async () => {
      const command = { type: 'click', text: 'submit button' };
      
      const result = await handleClickCommand(command, browserTabId);
      
      expect(chromeAPI.tabs.sendMessage).toHaveBeenCalledWith(
        browserTabId, 
        { type: 'CLICK', text: 'submit button' }
      );
      expect(result.success).toBe(true);
    });
    
    it('should handle errors correctly', async () => {
      const command = { type: 'click', text: 'submit button' };
      const error = new Error('Test error');
      
      chromeAPI.tabs.sendMessage.mockRejectedValueOnce(error);
      
      const result = await handleClickCommand(command, browserTabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
});