// Test file for the background.js main entry point - outcome focused
import { handleCommand } from '../src/background/background.js';

describe('Background Script', () => {
  // Store original chrome APIs
  const originalChrome = global.chrome;
  
  beforeEach(() => {
    // Mock chrome APIs
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn()
        }
      },
      tabs: {
        get: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        sendMessage: jest.fn(),
        captureVisibleTab: jest.fn().mockResolvedValue('data:image/png;base64,test')
      },
      scripting: {
        executeScript: jest.fn().mockResolvedValue([{result: {success: true}}])
      }
    };
    
    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    global.chrome = originalChrome;
    jest.clearAllMocks();
  });
  
  it('should provide a handleCommand function', () => {
    expect(typeof handleCommand).toBe('function');
  });
  
  it('should handle a navigation command', async () => {
    const result = await handleCommand({ type: 'navigation', url: 'https://example.com' });
    
    // Only verify we get a result with expected structure, not implementation details
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('screenshot');
  });
});