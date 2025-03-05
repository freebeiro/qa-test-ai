// Test file for content script core functionality
import { 
  setupMessageListener, 
  initialize, 
  isTabControlled, 
  setTabControlled 
} from '../src/content/content-core.js';

// Mock findAndClickElement and findAndTypeInElement
jest.mock('../src/content/element-actions.js', () => ({
  findAndClickElement: jest.fn().mockResolvedValue(true),
  findAndTypeInElement: jest.fn().mockResolvedValue(true)
}));

describe('Content Core', () => {
  let chromeOnMessageAddListenerSpy;
  let sendResponseMock;
  
  beforeEach(() => {
    // Reset module state between tests
    setTabControlled(false);
    
    // Setup mocks
    chromeOnMessageAddListenerSpy = jest.spyOn(chrome.runtime.onMessage, 'addListener');
    sendResponseMock = jest.fn();
  });
  
  afterEach(() => {
    chromeOnMessageAddListenerSpy.mockRestore();
  });
  
  describe('initialize', () => {
    it('should set tab as controlled and set up message listener', () => {
      initialize();
      
      expect(isTabControlled()).toBe(true);
      expect(chromeOnMessageAddListenerSpy).toHaveBeenCalled();
    });
  });
  
  describe('setupMessageListener', () => {
    it('should add a message listener', () => {
      setupMessageListener();
      
      expect(chromeOnMessageAddListenerSpy).toHaveBeenCalled();
    });
    
    it('should handle CLICK messages', async () => {
      setupMessageListener();
      
      // Get the listener function that was registered
      const listener = chromeOnMessageAddListenerSpy.mock.calls[0][0];
      
      // Call the listener with a CLICK message
      const returnValue = listener({ type: 'CLICK', text: 'test' }, {}, sendResponseMock);
      
      // Allow the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify expected behavior
      expect(returnValue).toBe(true); // Should return true to indicate async response
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });
    
    it('should handle TYPE_TARGETED messages', async () => {
      setupMessageListener();
      
      const listener = chromeOnMessageAddListenerSpy.mock.calls[0][0];
      const returnValue = listener(
        { type: 'TYPE_TARGETED', target: 'input field', text: 'test text' }, 
        {}, 
        sendResponseMock
      );
      
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(returnValue).toBe(true);
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });
    
    it('should handle PING messages', () => {
      setupMessageListener();
      
      const listener = chromeOnMessageAddListenerSpy.mock.calls[0][0];
      const returnValue = listener({ type: 'PING' }, {}, sendResponseMock);
      
      expect(returnValue).toBe(true);
      expect(sendResponseMock).toHaveBeenCalledWith({ success: true });
    });
  });
  
  describe('isTabControlled and setTabControlled', () => {
    it('should get and set tab controlled state', () => {
      expect(isTabControlled()).toBe(false);
      
      setTabControlled(true);
      expect(isTabControlled()).toBe(true);
      
      setTabControlled(false);
      expect(isTabControlled()).toBe(false);
    });
  });
});