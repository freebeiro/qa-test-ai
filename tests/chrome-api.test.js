// Test file for Chrome API wrapper
import chromeAPI from '../src/utils/chrome-api.js';
import { createNavigationHandler } from '../src/utils/chrome-navigation.js';

// Mock the createNavigationHandler dependency
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
        get: jest.fn(),
        update: jest.fn(),
        captureVisibleTab: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        sendMessage: jest.fn(),
        onUpdated: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        }
      },
      windows: {
        update: jest.fn(),
        create: jest.fn()
      },
      runtime: {
        getURL: jest.fn(),
        sendMessage: jest.fn(),
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
        executeScript: jest.fn()
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
  
  describe('tabs API', () => {
    it('should forward get call to chrome.tabs.get', () => {
      const tabId = 123;
      chromeAPI.tabs.get(tabId);
      expect(chrome.tabs.get).toHaveBeenCalledWith(tabId);
    });
    
    it('should forward update call to chrome.tabs.update', () => {
      const tabId = 123;
      const updateProperties = { url: 'https://example.com' };
      chromeAPI.tabs.update(tabId, updateProperties);
      expect(chrome.tabs.update).toHaveBeenCalledWith(tabId, updateProperties);
    });
    
    it('should forward captureVisibleTab call to chrome.tabs.captureVisibleTab', () => {
      const windowId = 456;
      const options = { format: 'png' };
      chromeAPI.tabs.captureVisibleTab(windowId, options);
      expect(chrome.tabs.captureVisibleTab).toHaveBeenCalledWith(windowId, options);
    });
    
    it('should use createNavigationHandler for goBack', () => {
      const tabId = 123;
      chromeAPI.tabs.goBack(tabId);
      expect(createNavigationHandler).toHaveBeenCalledWith(chrome.tabs.goBack, tabId);
    });
    
    it('should use createNavigationHandler for goForward', () => {
      const tabId = 123;
      chromeAPI.tabs.goForward(tabId);
      expect(createNavigationHandler).toHaveBeenCalledWith(chrome.tabs.goForward, tabId);
    });
    
    it('should forward sendMessage call to chrome.tabs.sendMessage', () => {
      const tabId = 123;
      const message = { type: 'TEST' };
      chromeAPI.tabs.sendMessage(tabId, message);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(tabId, message);
    });
  });
  
  describe('windows API', () => {
    it('should forward update call to chrome.windows.update', () => {
      const windowId = 456;
      const updateInfo = { focused: true };
      chromeAPI.windows.update(windowId, updateInfo);
      expect(chrome.windows.update).toHaveBeenCalledWith(windowId, updateInfo);
    });
    
    it('should forward create call to chrome.windows.create', () => {
      const createData = { url: 'popup.html', type: 'popup' };
      chromeAPI.windows.create(createData);
      expect(chrome.windows.create).toHaveBeenCalledWith(createData);
    });
  });
  
  describe('runtime API', () => {
    it('should forward getURL call to chrome.runtime.getURL', () => {
      const path = 'popup.html';
      chromeAPI.runtime.getURL(path);
      expect(chrome.runtime.getURL).toHaveBeenCalledWith(path);
    });
    
    it('should forward sendMessage call to chrome.runtime.sendMessage', () => {
      const message = { type: 'TEST' };
      chromeAPI.runtime.sendMessage(message);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(message);
    });
  });
  
  describe('scripting API', () => {
    it('should forward executeScript call to chrome.scripting.executeScript', () => {
      const injection = { target: { tabId: 123 }, func: () => {} };
      chromeAPI.scripting.executeScript(injection);
      expect(chrome.scripting.executeScript).toHaveBeenCalledWith(injection);
    });
  });
});