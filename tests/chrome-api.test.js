// Test file for Chrome API wrapper - focused on outcomes
import chromeAPI from '../src/utils/chrome-api.js';

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
  
  describe('API Structure', () => {
    it('should expose the expected Chrome API interfaces', () => {
      expect(chromeAPI.tabs).toBeDefined();
      expect(chromeAPI.windows).toBeDefined();
      expect(chromeAPI.runtime).toBeDefined();
      expect(chromeAPI.storage).toBeDefined();
      expect(chromeAPI.scripting).toBeDefined();
      expect(chromeAPI.action).toBeDefined();
    });
  });
  
  describe('Function Availability', () => {
    it('should provide expected tabs functions', () => {
      expect(typeof chromeAPI.tabs.get).toBe('function');
      expect(typeof chromeAPI.tabs.update).toBe('function');
      expect(typeof chromeAPI.tabs.captureVisibleTab).toBe('function');
      expect(typeof chromeAPI.tabs.goBack).toBe('function');
      expect(typeof chromeAPI.tabs.goForward).toBe('function');
      expect(typeof chromeAPI.tabs.sendMessage).toBe('function');
    });
    
    it('should provide expected windows functions', () => {
      expect(typeof chromeAPI.windows.update).toBe('function');
      expect(typeof chromeAPI.windows.create).toBe('function');
    });
    
    it('should provide expected runtime functions', () => {
      expect(typeof chromeAPI.runtime.getURL).toBe('function');
      expect(typeof chromeAPI.runtime.sendMessage).toBe('function');
      expect(chromeAPI.runtime.onMessage).toBeDefined();
    });
    
    it('should provide expected scripting functions', () => {
      expect(typeof chromeAPI.scripting.executeScript).toBe('function');
    });
  });
});