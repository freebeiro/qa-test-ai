// Test file for Chrome API wrapper - focused on outcomes
import chromeAPI from '../src/utils/chrome-api.js';
import { createNavigationHandler } from '../src/utils/chrome-navigation.js';

// Mock chrome-navigation.js
jest.mock('../src/utils/chrome-navigation.js', () => ({
  createNavigationHandler: jest.fn().mockImplementation(() => Promise.resolve({ success: true }))
}));

describe('Chrome API Wrapper', () => {
  // Store original chrome APIs to restore after tests
  const originalChrome = global.chrome;
  
  beforeEach(() => {
    // Set up basic chrome API mocks
    global.chrome = {
      tabs: {
        get: jest.fn().mockImplementation((tabId, callback) => {
          if (callback) callback({ id: tabId });
          return Promise.resolve({ id: tabId });
        }),
        update: jest.fn().mockResolvedValue({}),
        captureVisibleTab: jest.fn().mockResolvedValue('data:image/png;base64,test'),
        goBack: jest.fn(callback => { if (callback) callback(); }),
        goForward: jest.fn(callback => { if (callback) callback(); }),
        sendMessage: jest.fn().mockResolvedValue({ success: true }),
        onUpdated: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      windows: {
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({})
      },
      runtime: {
        getURL: jest.fn(path => `chrome-extension://abcdefg/${path}`),
        sendMessage: jest.fn().mockResolvedValue({}),
        onMessage: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue([{result: {}}])
      },
      action: {
        onClicked: {
          addListener: jest.fn()
        }
      }
    };
  });
  
  afterEach(() => {
    // Restore original chrome API
    global.chrome = originalChrome;
    jest.clearAllMocks();
  });
  
  describe('API Testing', () => {
    // Test Tabs API
    it('should pass parameters correctly for tabs API methods', async () => {
      await chromeAPI.tabs.get(123);
      expect(chrome.tabs.get).toHaveBeenCalledWith(123);
      
      await chromeAPI.tabs.update(123, { url: 'https://example.com' });
      expect(chrome.tabs.update).toHaveBeenCalledWith(123, { url: 'https://example.com' });
      
      await chromeAPI.tabs.captureVisibleTab(456, { format: 'png' });
      expect(chrome.tabs.captureVisibleTab).toHaveBeenCalledWith(456, { format: 'png' });
      
      await chromeAPI.tabs.goBack(123);
      expect(createNavigationHandler).toHaveBeenCalledWith(chrome.tabs.goBack, 123);
      
      await chromeAPI.tabs.goForward(123);
      expect(createNavigationHandler).toHaveBeenCalledWith(chrome.tabs.goForward, 123);
      
      await chromeAPI.tabs.sendMessage(123, { type: 'TEST' });
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, { type: 'TEST' });
    });
    
    // Test Windows API
    it('should pass parameters correctly for windows API methods', async () => {
      await chromeAPI.windows.update(456, { focused: true });
      expect(chrome.windows.update).toHaveBeenCalledWith(456, { focused: true });
      
      await chromeAPI.windows.create({ url: 'popup.html', type: 'popup' });
      expect(chrome.windows.create).toHaveBeenCalledWith({ url: 'popup.html', type: 'popup' });
    });
    
    // Test Runtime API
    it('should pass parameters correctly for runtime API methods', async () => {
      chromeAPI.runtime.getURL('popup.html');
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('popup.html');
      
      await chromeAPI.runtime.sendMessage({ type: 'TEST' });
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEST' });
    });
    
    // Test Scripting API
    it('should pass parameters correctly for scripting API methods', async () => {
      const injection = { target: { tabId: 123 }, func: () => {} };
      await chromeAPI.scripting.executeScript(injection);
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(injection);
    });
    
    // Test Storage API
    it('should correctly pass through the storage API', () => {
      chromeAPI.storage.local.set({ key: 'value' });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ key: 'value' });
    });
  });
  
  describe('API Reference Passing', () => {
    it('should pass through Chrome API references correctly', () => {
      expect(chromeAPI.tabs.onUpdated).toBe(chrome.tabs.onUpdated);
      expect(chromeAPI.runtime.onMessage).toBe(chrome.runtime.onMessage);
      expect(chromeAPI.action.onClicked).toBe(chrome.action.onClicked);
    });
  });
});