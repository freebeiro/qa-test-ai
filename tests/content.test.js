// Test file for the content.js main entry point - outcome focused
// Note: This is tricky to test purely on outcomes since it's mostly initialization
// We'll test it by checking if it sets up core content script functionality

describe('Content Script', () => {
  // Save original chrome object
  const originalChrome = global.chrome;
  
  beforeEach(() => {
    // Set up DOM for testing
    document.body.innerHTML = '<div id="test-element">Test</div>';
    
    // Set up chrome mocks 
    global.chrome = {
      runtime: {
        onMessage: {
          addListener: jest.fn()
        }
      }
    };
    
    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    // Restore original chrome
    global.chrome = originalChrome;
    
    // Clean up DOM
    document.body.innerHTML = '';
    
    jest.clearAllMocks();
  });
  
  it('should set up message listener when loaded', () => {
    // Import content.js which should set up the message listener
    require('../src/content/content.js');
    
    // Verify the message listener was set up
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
  });
});