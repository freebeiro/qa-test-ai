// Test file for the command handlers
import { formatUrl, formatError } from '../src/utils/index.js';
import { 
  getInputSelectionScript,
  getScrollScript,
  getPressEnterScript,
  handleNavigationCommand
} from '../src/commands/index.js';
import { commandHandlers, handleCommand } from '../src/background/background-core.js';

// Mock the Chrome API
jest.mock('../src/utils/chrome-api.js', () => {
  return {
    __esModule: true,
    default: {
      tabs: {
        get: jest.fn(),
        update: jest.fn(),
        captureVisibleTab: jest.fn(),
        goBack: jest.fn(),
        goForward: jest.fn(),
        sendMessage: jest.fn(),
        onUpdated: {
          addListener: jest.fn((callback) => {
            // Mock the callback immediately for testing
            callback(123, { status: 'complete' });
          }),
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
        executeScript: jest.fn().mockResolvedValue([{result: {success: true}}])
      },
      action: {
        onClicked: {
          addListener: jest.fn()
        }
      }
    }
  };
});

// Mock the screenshot function
jest.mock('../src/utils/screenshot.js', () => ({
  captureScreenshot: jest.fn().mockResolvedValue('mock-screenshot-data')
}));

describe('Pure Functions', () => {
  test('formatUrl adds https:// when protocol missing', () => {
    expect(formatUrl('example.com')).toBe('https://example.com');
    expect(formatUrl('http://example.com')).toBe('http://example.com');
  });
  
  test('formatError formats error objects correctly', () => {
    const error = new Error('Test error');
    const result = formatError(error);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Test error');
  });
  
  test('getInputSelectionScript returns correct script', () => {
    const script = getInputSelectionScript('Test input');
    expect(script.args).toEqual(['Test input']);
    expect(typeof script.function).toBe('function');
  });
  
  test('getScrollScript returns correct script', () => {
    const script = getScrollScript(100);
    expect(script.args).toEqual([100]);
    expect(typeof script.function).toBe('function');
  });
  
  test('getPressEnterScript returns correct script', () => {
    const script = getPressEnterScript();
    expect(typeof script.function).toBe('function');
  });
});

describe('Command Handlers', () => {
  test('handleNavigationCommand navigates to URL', async () => {
    const chromeAPI = require('../src/utils/chrome-api.js').default;
    const tabId = 123;
    const command = { type: 'navigation', url: 'example.com' };
    
    const result = await handleNavigationCommand(command, tabId);
    
    expect(chromeAPI.tabs.update).toHaveBeenCalledWith(tabId, { url: 'https://example.com' });
    expect(result.success).toBe(true);
  });
  
  test('handleCommand selects the correct handler', async () => {
    // Import the modules we want to spy on
    const mockCommandHandlers = {
      'navigation': jest.fn().mockResolvedValue({ success: true })
    };
    
    // Replace commandHandlers with our mock
    const originalHandlers = { ...commandHandlers };
    Object.keys(commandHandlers).forEach(key => {
      if (key in mockCommandHandlers) {
        commandHandlers[key] = mockCommandHandlers[key];
      } else {
        delete commandHandlers[key];
      }
    });
    
    try {
      const command = { type: 'navigation', url: 'example.com' };
      const result = await handleCommand(command);
      
      expect(mockCommandHandlers.navigation).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.screenshot).toBe('mock-screenshot-data');
    } finally {
      // Restore the original handlers
      Object.keys(originalHandlers).forEach(key => {
        commandHandlers[key] = originalHandlers[key];
      });
    }
  });
});