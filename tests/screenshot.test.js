// Test file for screenshot functionality - focused on outcomes
import { captureScreenshot } from '../src/utils/screenshot.js';
import { getActiveTab, wait } from '../src/utils/background-utils.js';
import chromeAPI from '../src/utils/chrome-api.js';

// Mock dependencies
jest.mock('../src/utils/background-utils.js', () => ({
  getActiveTab: jest.fn().mockResolvedValue({ id: 123, windowId: 456 }),
  wait: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/utils/chrome-api.js', () => ({
  __esModule: true,
  default: {
    tabs: {
      captureVisibleTab: jest.fn().mockResolvedValue('data:image/png;base64,mockScreenshot')
    }
  }
}));

describe('Screenshot Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('captureScreenshot', () => {
    it('should return screenshot data when valid tabId is provided', async () => {
      const result = await captureScreenshot(123);
      
      expect(getActiveTab).toHaveBeenCalledWith(123);
      expect(wait).toHaveBeenCalledWith(500);
      expect(chromeAPI.tabs.captureVisibleTab).toHaveBeenCalledWith(456, {
        format: 'png',
        quality: 100
      });
      
      expect(result).toBe('data:image/png;base64,mockScreenshot');
    });
    
    it('should return null when no tabId is provided', async () => {
      const result = await captureScreenshot(null);
      expect(result).toBeNull();
    });
    
    it('should return null when getActiveTab returns no tab', async () => {
      getActiveTab.mockResolvedValueOnce(null);
      
      const result = await captureScreenshot(123);
      
      expect(result).toBeNull();
      expect(getActiveTab).toHaveBeenCalledWith(123);
    });
    
    it('should handle errors gracefully', async () => {
      chromeAPI.tabs.captureVisibleTab.mockRejectedValueOnce(new Error('Screenshot failed'));
      
      const result = await captureScreenshot(123);
      
      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});