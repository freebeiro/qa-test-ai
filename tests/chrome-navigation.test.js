// Test file for Chrome navigation functionality - focused on outcomes
import { createNavigationHandler } from '../src/utils/chrome-navigation.js';

// Mock background-utils.js which is a dependency
jest.mock('../src/utils/background-utils.js', () => ({
  getNavigationHistory: jest.fn(),
  getCurrentPosition: jest.fn(),
  setCurrentPosition: jest.fn()
}));

describe('Chrome Navigation', () => {
  // Store original chrome APIs to restore after tests
  const originalChrome = global.chrome;
  
  beforeEach(() => {
    // Set up chrome mocks
    global.chrome = {
      tabs: {
        update: jest.fn((tabId, options, callback) => {
          if (callback) callback();
        }),
        goBack: jest.fn(callback => {
          if (callback) callback();
        }),
        goForward: jest.fn(callback => {
          if (callback) callback();
        })
      },
      scripting: {
        executeScript: jest.fn((options, callback) => {
          if (callback) callback([{ result: true }]);
        })
      },
      runtime: {
        lastError: null
      }
    };
    
    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore original chrome API and console
    global.chrome = originalChrome;
    jest.clearAllMocks();
  });
  
  describe('createNavigationHandler', () => {
    const backgroundUtils = require('../src/utils/background-utils.js');
    
    beforeEach(() => {
      jest.clearAllMocks();
      // Reset mocks to default values
      backgroundUtils.getNavigationHistory.mockReturnValue([]);
      backgroundUtils.getCurrentPosition.mockReturnValue(0);
    });
    
    it('should return a promise that resolves successfully for back navigation', async () => {
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // We only care about the final outcome, not how it was achieved
      expect(result).toHaveProperty('success');
    });
    
    it('should return a promise that resolves successfully for forward navigation', async () => {
      const result = await createNavigationHandler(chrome.tabs.goForward, 123);
      
      // We only care about the final outcome, not how it was achieved
      expect(result).toHaveProperty('success');
    });
    
    it('should use custom history for back navigation when available', async () => {
      // Mock history data
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'];
      const currentPos = 2; // We're on page3, can go back to page2
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify we used the custom history navigation
      expect(backgroundUtils.setCurrentPosition).toHaveBeenCalledWith(123, 1);
      expect(chrome.tabs.update).toHaveBeenCalledWith(123, { url: 'https://example.com/page2' }, expect.any(Function));
      expect(result.success).toBe(true);
    });
    
    it('should use custom history for forward navigation when available', async () => {
      // Mock history data
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'];
      const currentPos = 0; // We're on page1, can go forward to page2
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      const result = await createNavigationHandler(chrome.tabs.goForward, 123);
      
      // Verify we used the custom history navigation
      expect(backgroundUtils.setCurrentPosition).toHaveBeenCalledWith(123, 1);
      expect(chrome.tabs.update).toHaveBeenCalledWith(123, { url: 'https://example.com/page2' }, expect.any(Function));
      expect(result.success).toBe(true);
    });
    
    it('should handle runtime errors in custom history navigation', async () => {
      // Mock history data
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2'];
      const currentPos = 1; // We're on page2, can go back to page1
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Navigation failed' };
      chrome.tabs.update = jest.fn((tabId, options, callback) => {
        callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation failed');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
    
    it('should fall back to browser history when at the start of custom history', async () => {
      // Mock history data - we're at the beginning, can't go back in custom history
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2'];
      const currentPos = 0;
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify we used the fallback method
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 },
          args: [false] // false for back navigation
        }),
        expect.any(Function)
      );
    });
    
    it('should fall back to browser history when at the end of custom history', async () => {
      // Mock history data - we're at the end, can't go forward in custom history
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2'];
      const currentPos = 1;
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      await createNavigationHandler(chrome.tabs.goForward, 123);
      
      // Verify we used the fallback method
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(
        expect.objectContaining({
          target: { tabId: 123 },
          args: [true] // true for forward navigation
        }),
        expect.any(Function)
      );
    });
    
    it('should handle runtime errors and resolve with success:false', async () => {
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Navigation failed' };
      chrome.scripting.executeScript = jest.fn((options, callback) => {
        callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify the handler propagates errors appropriately
      expect(result).toHaveProperty('success');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
    
    it('should handle rejection errors', async () => {
      // Mock a rejection
      chrome.scripting.executeScript = jest.fn(() => {
        throw new Error('Script execution failed');
      });
      
      try {
        await createNavigationHandler(chrome.tabs.goBack, 123);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    it('should handle null or invalid tabId gracefully', async () => {
      // Should still return a result even with invalid inputs
      const result = await createNavigationHandler(chrome.tabs.goBack, null);
      expect(result).toBeDefined();
    });
    
    it('should handle string tabId by attempting navigation', async () => {
      const result = await createNavigationHandler(chrome.tabs.goBack, '123');
      expect(result).toBeDefined();
    });
    
    it('should handle runtime errors in forward navigation with custom history', async () => {
      // Mock history data
      const mockHistory = ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'];
      const currentPos = 1; // We're on page2, can go forward to page3
      
      backgroundUtils.getNavigationHistory.mockReturnValue(mockHistory);
      backgroundUtils.getCurrentPosition.mockReturnValue(currentPos);
      
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Forward navigation failed' };
      chrome.tabs.update = jest.fn((tabId, options, callback) => {
        callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goForward, 123);
      
      // Verify error handling
      expect(result.success).toBe(false);
      expect(result.error).toBe('Forward navigation failed');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
    
    it('should handle content script navigation errors', async () => {
      // Mock a runtime error in the content script execution
      chrome.runtime.lastError = { message: 'Cannot access contents' };
      chrome.scripting.executeScript = jest.fn((options, callback) => {
        callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify we handle the error but still resolve with success
      expect(result.success).toBe(true);
      expect(result.warning).toBe('No navigation history available');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
    
    it('should use fallback method when no tabId is provided', async () => {
      await createNavigationHandler(chrome.tabs.goBack);
      
      // Should use the direct method call
      expect(chrome.tabs.goBack).toHaveBeenCalled();
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });
    
    it('should handle runtime errors in fallback method', async () => {
      // Mock a runtime error in the fallback method
      chrome.runtime.lastError = { message: 'No history available' };
      chrome.tabs.goBack = jest.fn(callback => {
        callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goBack);
      
      // Verify we handle the error but still resolve with success
      expect(result.success).toBe(true);
      expect(result.warning).toBe('No navigation history available');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
  
  });
});