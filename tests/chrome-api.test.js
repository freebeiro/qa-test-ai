// Test file for Chrome API wrapper - focused on outcomes
import chromeAPI from '../src/utils/chrome-api.js';

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
  
  describe('Tabs API', () => {
    it('should provide a working tabs.get method', async () => {
      const result = await chromeAPI.tabs.get(123);
      expect(result).toHaveProperty('id', 123);
    });
    
    it('should provide a working tabs.update method', async () => {
      await chromeAPI.tabs.update(123, { url: 'https://example.com' });
      // Test passes if no exception is thrown
    });
    
    it('should provide a working tabs.captureVisibleTab method', async () => {
      const screenshot = await chromeAPI.tabs.captureVisibleTab(456, { format: 'png' });
      expect(screenshot).toBeDefined();
    });
    
    it('should provide a working tabs.goBack method', async () => {
      const result = await chromeAPI.tabs.goBack(123);
      expect(result).toBeDefined();
    });
    
    it('should provide a working tabs.goForward method', async () => {
      const result = await chromeAPI.tabs.goForward(123);
      expect(result).toBeDefined();
    });
    
    it('should provide a working tabs.sendMessage method', async () => {
      const result = await chromeAPI.tabs.sendMessage(123, { type: 'TEST' });
      expect(result).toHaveProperty('success', true);
    });
  });
  
  describe('Windows API', () => {
    it('should provide a working windows.update method', async () => {
      await chromeAPI.windows.update(456, { focused: true });
      // Test passes if no exception is thrown
    });
    
    it('should provide a working windows.create method', async () => {
      await chromeAPI.windows.create({ url: 'popup.html', type: 'popup' });
      // Test passes if no exception is thrown
    });
  });
  
  describe('Runtime API', () => {
    it('should provide a working runtime.getURL method', () => {
      const url = chromeAPI.runtime.getURL('popup.html');
      expect(url).toContain('popup.html');
    });
    
    it('should provide a working runtime.sendMessage method', async () => {
      await chromeAPI.runtime.sendMessage({ type: 'TEST' });
      // Test passes if no exception is thrown
    });
  });
  
  describe('Storage API', () => {
    it('should expose the chrome.storage.local API', () => {
      expect(chromeAPI.storage.local).toBeDefined();
    });
  });
  
  describe('Scripting API', () => {
    it('should provide a working scripting.executeScript method', async () => {
      await chromeAPI.scripting.executeScript({ target: { tabId: 123 }, func: () => {} });
      // Test passes if no exception is thrown
    });
  });
  
  describe('Action API', () => {
    it('should expose the chrome.action.onClicked API', () => {
      expect(chromeAPI.action.onClicked).toBeDefined();
      expect(typeof chromeAPI.action.onClicked.addListener).toBe('function');
    });
  });
});