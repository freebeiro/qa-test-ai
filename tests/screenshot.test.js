// Test file for screenshot functionality - focused on outcomes
import { captureScreenshot } from '../src/utils/screenshot.js';

describe('Screenshot Functionality', () => {
  // Store original chrome APIs
  const originalChrome = global.chrome;
  
  beforeEach(() => {
    // Set up chrome API mocks
    global.chrome = {
      tabs: {
        get: jest.fn().mockImplementation((tabId, callback) => {
          callback({ id: tabId, windowId: 456 });
        }),
        captureVisibleTab: jest.fn().mockImplementation((windowId, options, callback) => {
          return Promise.resolve('data:image/png;base64,mockScreenshot');
        })
      }
    };
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    // Restore original APIs
    global.chrome = originalChrome;
    jest.clearAllMocks();
  });
  
  describe('captureScreenshot', () => {
    it('should return screenshot data when valid tabId is provided', async () => {
      const result = await captureScreenshot(123);
      
      // Only check that we got a screenshot string back
      expect(typeof result).toBe('string');
      expect(result).toContain('data:image');
    });
    
    it('should return null when no tabId is provided', async () => {
      const result = await captureScreenshot(null);
      expect(result).toBeNull();
    });
    
    it('should handle errors gracefully', async () => {
      // Force an error
      chrome.tabs.captureVisibleTab = jest.fn().mockRejectedValueOnce(new Error('Screenshot failed'));
      
      const result = await captureScreenshot(123);
      
      // Should handle errors without crashing
      expect(result).toBeNull();
    });
  });
});