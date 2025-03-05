// Test file for screenshot functionality
import { captureScreenshot } from '../src/utils/screenshot.js';
import { getActiveTab, wait } from '../src/utils/background-utils.js';
import chromeAPI from '../src/utils/chrome-api.js';

// Mock dependencies
jest.mock('../src/utils/background-utils.js', () => ({
  getActiveTab: jest.fn(),
  wait: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../src/utils/chrome-api.js', () => ({
  __esModule: true,
  default: {
    tabs: {
      captureVisibleTab: jest.fn()
    }
  }
}));

describe('Screenshot Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('captureScreenshot', () => {
    it('should return null if no tabId is provided', async () => {
      const result = await captureScreenshot(null);
      expect(result).toBeNull();
      expect(getActiveTab).not.toHaveBeenCalled();
    });
    
    it('should return null if getActiveTab returns no tab', async () => {
      getActiveTab.mockResolvedValueOnce(null);
      
      const result = await captureScreenshot(123);
      
      expect(result).toBeNull();
      expect(getActiveTab).toHaveBeenCalledWith(123);
      expect(chromeAPI.tabs.captureVisibleTab).not.toHaveBeenCalled();
    });
    
    it('should capture screenshot with correct parameters', async () => {
      const mockTab = { id: 123, windowId: 456 };
      const mockScreenshotData = 'data:image/png;base64,abc123';
      
      getActiveTab.mockResolvedValueOnce(mockTab);
      chromeAPI.tabs.captureVisibleTab.mockResolvedValueOnce(mockScreenshotData);
      
      const result = await captureScreenshot(123);
      
      expect(getActiveTab).toHaveBeenCalledWith(123);
      expect(wait).toHaveBeenCalledWith(500);
      expect(chromeAPI.tabs.captureVisibleTab).toHaveBeenCalledWith(456, {
        format: 'png',
        quality: 100
      });
      expect(result).toBe(mockScreenshotData);
    });
    
    it('should return null and log error if screenshot fails', async () => {
      const mockTab = { id: 123, windowId: 456 };
      const mockError = new Error('Screenshot failed');
      
      getActiveTab.mockResolvedValueOnce(mockTab);
      chromeAPI.tabs.captureVisibleTab.mockRejectedValueOnce(mockError);
      
      // Mock console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await captureScreenshot(123);
      
      expect(getActiveTab).toHaveBeenCalledWith(123);
      expect(chromeAPI.tabs.captureVisibleTab).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Screenshot failed:', mockError);
      expect(result).toBeNull();
      
      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});