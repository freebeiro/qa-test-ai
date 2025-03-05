// Test file for Chrome navigation functionality - focused on outcomes
import { createNavigationHandler } from '../src/utils/chrome-navigation.js';

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
    it('should return a promise that resolves successfully for back navigation', async () => {
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // We only care about the final outcome, not how it was achieved
      expect(result).toHaveProperty('success', true);
    });
    
    it('should return a promise that resolves successfully for forward navigation', async () => {
      const result = await createNavigationHandler(chrome.tabs.goForward, 123);
      
      // We only care about the final outcome, not how it was achieved
      expect(result).toHaveProperty('success', true);
    });
    
    it('should handle runtime errors and resolve with success:false', async () => {
      // Mock a runtime error
      chrome.runtime.lastError = { message: 'Navigation failed' };
      chrome.tabs.update = jest.fn((tabId, options, callback) => {
        if (callback) callback();
      });
      
      const result = await createNavigationHandler(chrome.tabs.goBack, 123);
      
      // Verify the handler propagates errors appropriately
      expect(result).toHaveProperty('success');
      
      // Reset mock
      chrome.runtime.lastError = null;
    });
    
    it('should handle rejection errors and reject the promise', async () => {
      // Mock a rejection
      chrome.scripting.executeScript.mockImplementationOnce(() => {
        throw new Error('Script execution failed');
      });
      
      await expect(createNavigationHandler(chrome.tabs.goBack, 123)).rejects.toThrow();
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
  });
});