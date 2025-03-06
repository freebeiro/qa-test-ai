// Test file for navigation handlers
import { 
  handleNavigationCommand,
  handleBackCommand,
  handleForwardCommand
} from '../src/commands/navigation-handlers.js';
import { formatUrl, chromeAPI } from '../src/utils/index.js';

// Mock utilities
jest.mock('../src/utils/index.js', () => {
  return {
    formatUrl: jest.fn(url => url.startsWith('http') ? url : `https://${url}`),
    formatError: jest.fn(error => ({ success: false, error: error.message })),
    chromeAPI: {
      tabs: {
        update: jest.fn().mockResolvedValue({}),
        goBack: jest.fn().mockResolvedValue({ success: true }),
        goForward: jest.fn().mockResolvedValue({ success: true }),
        onUpdated: {
          addListener: jest.fn((callback) => {
            // Mock the callback immediately for testing
            setTimeout(() => callback(123, { status: 'complete' }), 0);
          }),
          removeListener: jest.fn()
        }
      }
    },
    trackNavigation: jest.fn()
  };
});

describe('Navigation Handlers', () => {
  const utils = require('../src/utils/index.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleNavigationCommand', () => {
    it('should navigate to the formatted URL', async () => {
      const command = { type: 'navigation', url: 'example.com' };
      const tabId = 123;
      
      const result = await handleNavigationCommand(command, tabId);
      
      expect(utils.formatUrl).toHaveBeenCalledWith('example.com');
      expect(utils.trackNavigation).toHaveBeenCalledWith(tabId, 'https://example.com');
      expect(utils.chromeAPI.tabs.update).toHaveBeenCalledWith(tabId, { url: 'https://example.com' });
      expect(result.success).toBe(true);
    });
    
    it('should handle navigation errors', async () => {
      const command = { type: 'navigation', url: 'example.com' };
      const tabId = 123;
      const error = new Error('Navigation failed');
      
      utils.chromeAPI.tabs.update.mockRejectedValueOnce(error);
      
      const result = await handleNavigationCommand(command, tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Navigation failed');
    });
  });
  
  describe('handleBackCommand', () => {
    it('should navigate back in history', async () => {
      const command = { type: 'back' };
      const tabId = 123;
      
      const result = await handleBackCommand(command, tabId);
      
      expect(utils.chromeAPI.tabs.goBack).toHaveBeenCalledWith(tabId);
      expect(result.success).toBe(true);
    });
    
    it('should handle string tab IDs by converting them to numbers', async () => {
      const command = { type: 'back' };
      const tabId = '123';
      
      await handleBackCommand(command, tabId);
      
      expect(utils.chromeAPI.tabs.goBack).toHaveBeenCalledWith(123);
    });
    
    it('should handle back navigation errors', async () => {
      const command = { type: 'back' };
      const tabId = 123;
      const error = new Error('Back navigation failed');
      
      utils.chromeAPI.tabs.goBack.mockRejectedValueOnce(error);
      
      const result = await handleBackCommand(command, tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Back navigation failed');
    });
  });
  
  describe('handleForwardCommand', () => {
    it('should navigate forward in history', async () => {
      const command = { type: 'forward' };
      const tabId = 123;
      
      const result = await handleForwardCommand(command, tabId);
      
      expect(utils.chromeAPI.tabs.goForward).toHaveBeenCalledWith(tabId);
      expect(result.success).toBe(true);
    });
    
    it('should handle string tab IDs by converting them to numbers', async () => {
      const command = { type: 'forward' };
      const tabId = '123';
      
      await handleForwardCommand(command, tabId);
      
      expect(utils.chromeAPI.tabs.goForward).toHaveBeenCalledWith(123);
    });
    
    it('should handle forward navigation errors', async () => {
      const command = { type: 'forward' };
      const tabId = 123;
      const error = new Error('Forward navigation failed');
      
      utils.chromeAPI.tabs.goForward.mockRejectedValueOnce(error);
      
      const result = await handleForwardCommand(command, tabId);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Forward navigation failed');
    });
  });
});