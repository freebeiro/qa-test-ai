// Test file for background utilities - outcome focused
import { 
  trackNavigation,
  getNavigationHistory,
  getCurrentPosition,
  setCurrentPosition,
  getActiveTab,
  wait,
  formatUrl,
  formatError
} from '../src/utils/background-utils.js';

// Mock Chrome API
jest.mock('../src/utils/chrome-api.js', () => ({
  __esModule: true,
  default: {
    tabs: {
      get: jest.fn().mockResolvedValue({ id: 123, windowId: 456 }),
      update: jest.fn().mockResolvedValue({})
    },
    windows: {
      update: jest.fn().mockResolvedValue({})
    }
  }
}));

describe('Background Utilities', () => {
  beforeEach(() => {
    // Clear navigation history between tests
    const tabIds = [123, 456, 789];
    tabIds.forEach(tabId => {
      trackNavigation(tabId, 'about:blank');
      // Clear history by implementation detail reset
      // This is necessary since the module maintains state between tests
      getNavigationHistory(tabId).length = 0;
      setCurrentPosition(tabId, 0);
    });
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Navigation History Tracking', () => {
    it('should track navigation history for a tab', () => {
      // Test the overall navigation tracking behavior
      const tabId = 123;
      
      // Navigate to multiple pages
      trackNavigation(tabId, 'https://example.com');
      trackNavigation(tabId, 'https://example.com/page1');
      trackNavigation(tabId, 'https://example.com/page2');
      
      // Check history
      const history = getNavigationHistory(tabId);
      expect(history.length).toBe(3);
      expect(history[0]).toBe('https://example.com');
      expect(history[1]).toBe('https://example.com/page1');
      expect(history[2]).toBe('https://example.com/page2');
      
      // Check position
      const position = getCurrentPosition(tabId);
      expect(position).toBe(2); // 0-indexed, so 2 is the 3rd item
    });
    
    it('should truncate forward history when navigating from middle', () => {
      const tabId = 123;
      
      // Navigate to multiple pages
      trackNavigation(tabId, 'https://example.com');
      trackNavigation(tabId, 'https://example.com/page1');
      trackNavigation(tabId, 'https://example.com/page2');
      
      // Go back
      setCurrentPosition(tabId, 1);
      
      // Navigate to a new page (should truncate forward history)
      trackNavigation(tabId, 'https://example.com/newpage');
      
      // Check history
      const history = getNavigationHistory(tabId);
      expect(history.length).toBe(3);
      expect(history[0]).toBe('https://example.com');
      expect(history[1]).toBe('https://example.com/page1');
      expect(history[2]).toBe('https://example.com/newpage');
    });
    
    it('should handle empty history gracefully', () => {
      const tabId = 999; // unused tab ID
      
      const history = getNavigationHistory(tabId);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBe(0);
      
      const position = getCurrentPosition(tabId);
      expect(position).toBe(0);
    });
    
    it('should prevent setting invalid positions', () => {
      const tabId = 123;
      
      // Navigate to a page
      trackNavigation(tabId, 'https://example.com');
      
      // Try to set invalid position
      const result = setCurrentPosition(tabId, 999);
      expect(result).toBe(false);
      
      // Position should remain unchanged
      expect(getCurrentPosition(tabId)).toBe(0);
    });
  });
  
  describe('Tab Management', () => {
    it('should get and focus the active tab', async () => {
      const tab = await getActiveTab(123);
      
      expect(tab).toHaveProperty('id', 123);
      expect(tab).toHaveProperty('windowId', 456);
    });
    
    it('should handle errors when getting tab', async () => {
      // Simulate error
      const chromeAPI = require('../src/utils/chrome-api.js').default;
      chromeAPI.tabs.get.mockRejectedValueOnce(new Error('Tab not found'));
      
      const tab = await getActiveTab(999);
      
      expect(tab).toBeNull();
    });
  });
  
  describe('Utility Functions', () => {
    it('should wait for the specified time', async () => {
      const start = Date.now();
      await wait(100);
      const elapsed = Date.now() - start;
      
      // Allow some tolerance in timing
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
    
    it('should format URLs with protocol', () => {
      expect(formatUrl('example.com')).toBe('https://example.com');
      expect(formatUrl('http://example.com')).toBe('http://example.com');
      expect(formatUrl('https://example.com')).toBe('https://example.com');
    });
    
    it('should format error objects', () => {
      const error = new Error('Test error');
      const result = formatError(error);
      
      expect(result).toEqual({
        success: false,
        error: 'Test error'
      });
      
      // Handle errors without message
      const emptyError = new Error();
      const emptyResult = formatError(emptyError);
      
      expect(emptyResult).toEqual({
        success: false,
        error: 'Unknown error'
      });
    });
  });
});