// Test file for background core functionality
import { 
  commandHandlers,
  handleCommand,
  setupMessageHandler,
  setupExtensionHandler,
  initialize,
  getBrowserTabId,
  setBrowserTabId
} from '../src/background/background-core.js';

// Mock utils
jest.mock('../src/utils/index.js', () => ({
  captureScreenshot: jest.fn().mockResolvedValue('mock-screenshot-data'),
  wait: jest.fn().mockResolvedValue(undefined),
  formatError: jest.fn(error => ({ success: false, error: error.message })),
  chromeAPI: {
    runtime: {
      onMessage: {
        addListener: jest.fn()
      },
      getURL: jest.fn().mockReturnValue('popup.html')
    },
    action: {
      onClicked: {
        addListener: jest.fn()
      }
    },
    windows: {
      create: jest.fn()
    },
    storage: {
      local: {
        get: jest.fn((key, callback) => {
          callback({ browserTabId: 123 });
        }),
        set: jest.fn()
      }
    }
  }
}));

// Mock command handlers
jest.mock('../src/commands/index.js', () => ({
  handleTypingCommand: jest.fn().mockResolvedValue({ success: true }),
  handlePressEnterCommand: jest.fn().mockResolvedValue({ success: true }),
  handleScrollCommand: jest.fn().mockResolvedValue({ success: true }),
  handleClickCommand: jest.fn().mockResolvedValue({ success: true }),
  handleNavigationCommand: jest.fn().mockResolvedValue({ success: true }),
  handleBackCommand: jest.fn().mockResolvedValue({ success: true }),
  handleForwardCommand: jest.fn().mockResolvedValue({ success: true }),
  handleCoordinateClickCommand: jest.fn().mockResolvedValue({ success: true }),
  handleCaptchaCommand: jest.fn().mockResolvedValue({ success: true })
}));

describe('Background Core', () => {
  const utils = require('../src/utils/index.js');
  const commands = require('../src/commands/index.js');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleCommand', () => {
    it('should call the correct handler for a known command type', async () => {
      const command = { type: 'click', text: 'button' };
      
      const result = await handleCommand(command);
      
      expect(commands.handleClickCommand).toHaveBeenCalledWith(command, null);
      expect(utils.wait).toHaveBeenCalledWith(1000);
      expect(utils.captureScreenshot).toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: undefined,
        error: undefined,
        screenshot: 'mock-screenshot-data'
      });
    });
    
    it('should return error for unknown command type', async () => {
      const command = { type: 'unknown' };
      
      const result = await handleCommand(command);
      
      expect(result).toEqual({
        success: false,
        error: 'Unknown command type: unknown'
      });
    });
    
    it('should handle errors from command handlers', async () => {
      const command = { type: 'click', text: 'button' };
      const error = new Error('Test error');
      
      commands.handleClickCommand.mockRejectedValueOnce(error);
      
      const result = await handleCommand(command);
      
      expect(utils.formatError).toHaveBeenCalledWith(error);
    });
    
    it('should handle success with message from command handlers', async () => {
      const command = { type: 'click', text: 'button' };
      commands.handleClickCommand.mockResolvedValueOnce({ 
        success: true, 
        message: 'Successfully clicked' 
      });
      
      const result = await handleCommand(command);
      
      expect(result).toEqual({
        success: true,
        message: 'Successfully clicked',
        error: undefined,
        screenshot: 'mock-screenshot-data'
      });
    });
    
    it('should handle failure with error from command handlers', async () => {
      const command = { type: 'click', text: 'button' };
      commands.handleClickCommand.mockResolvedValueOnce({ 
        success: false, 
        error: 'Failed to click' 
      });
      
      const result = await handleCommand(command);
      
      expect(result).toEqual({
        success: false,
        message: undefined,
        error: 'Failed to click',
        screenshot: 'mock-screenshot-data'
      });
    });

    it('should handle null screenshot result', async () => {
      const command = { type: 'click', text: 'button' };
      utils.captureScreenshot.mockResolvedValueOnce(null);
      
      const result = await handleCommand(command);
      
      expect(result).toEqual({
        success: true,
        message: undefined,
        error: undefined,
        screenshot: null
      });
    });
  });
  
  describe('setupMessageHandler', () => {
    it('should add a message listener', () => {
      setupMessageHandler();
      
      expect(utils.chromeAPI.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    it('should handle EXECUTE_COMMAND messages', async () => {
      setupMessageHandler();
      
      // Get the listener that was registered
      const listener = utils.chromeAPI.runtime.onMessage.addListener.mock.calls[0][0];
      const sendResponseMock = jest.fn();
      
      // Spy on handleCommand
      const handleCommandSpy = jest.spyOn({ handleCommand }, 'handleCommand');
      handleCommandSpy.mockResolvedValue({ success: true });
      
      // Call the listener with a message
      const returnValue = listener(
        { type: 'EXECUTE_COMMAND', command: { type: 'click' } },
        {},
        sendResponseMock
      );
      
      // Allow the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(returnValue).toBe(true);
      
      // Restore the spy
      handleCommandSpy.mockRestore();
    });
    
    it('should handle non-EXECUTE_COMMAND messages', async () => {
      setupMessageHandler();
      
      // Get the listener that was registered
      const listener = utils.chromeAPI.runtime.onMessage.addListener.mock.calls[0][0];
      const sendResponseMock = jest.fn();
      
      // Call the listener with a different message type
      const returnValue = listener(
        { type: 'OTHER_MESSAGE' },
        {},
        sendResponseMock
      );
      
      // Non-EXECUTE_COMMAND messages should not return true
      expect(returnValue).not.toBe(true);
      expect(sendResponseMock).not.toHaveBeenCalled();
    });
    
    it('should handle errors in EXECUTE_COMMAND messages', async () => {
      setupMessageHandler();
      
      // Get the listener that was registered
      const listener = utils.chromeAPI.runtime.onMessage.addListener.mock.calls[0][0];
      const sendResponseMock = jest.fn();
      
      // Spy on handleCommand and make it throw
      const handleCommandSpy = jest.spyOn({ handleCommand }, 'handleCommand');
      const error = new Error('Test error');
      handleCommandSpy.mockRejectedValue(error);
      
      // Call the listener with a message
      listener(
        { type: 'EXECUTE_COMMAND', command: { type: 'click' } },
        {},
        sendResponseMock
      );
      
      // Allow the promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Verify that formatError was used for the response
      expect(utils.formatError).toHaveBeenCalledWith(error);
      
      // Restore the spy
      handleCommandSpy.mockRestore();
    });
  });
  
  describe('setupExtensionHandler', () => {
    it('should add a click listener to the extension action', () => {
      setupExtensionHandler();
      
      expect(utils.chromeAPI.action.onClicked.addListener).toHaveBeenCalled();
    });
    
    it('should open popup window and set browserTabId when extension is clicked', async () => {
      setupExtensionHandler();
      
      // Get the listener
      const listener = utils.chromeAPI.action.onClicked.addListener.mock.calls[0][0];
      
      // Call the listener with a tab
      await listener({ id: '456' });
      
      expect(utils.chromeAPI.windows.create).toHaveBeenCalledWith({
        url: 'popup.html',
        type: 'popup',
        width: 500,
        height: 700
      });
      
      expect(utils.chromeAPI.storage.local.set).toHaveBeenCalledWith({ browserTabId: 456 });
    });

    it('should handle null tab ID', async () => {
      setupExtensionHandler();
      
      // Get the listener
      const listener = utils.chromeAPI.action.onClicked.addListener.mock.calls[0][0];
      
      // Call the listener with a tab with null id
      await listener({ id: null });
      
      expect(utils.chromeAPI.windows.create).toHaveBeenCalled();
      expect(utils.chromeAPI.storage.local.set).toHaveBeenCalledWith({ browserTabId: null });
    });

    it('should handle undefined tab', async () => {
      setupExtensionHandler();
      
      // Get the listener
      const listener = utils.chromeAPI.action.onClicked.addListener.mock.calls[0][0];
      
      // Call the listener with undefined
      await listener(undefined);
      
      expect(utils.chromeAPI.windows.create).toHaveBeenCalled();
      expect(utils.chromeAPI.storage.local.set).toHaveBeenCalledWith({ browserTabId: null });
    });
  });
  
  describe('initialize', () => {
    it('should set up message handler and extension handler', () => {
      const setupMessageHandlerSpy = jest.spyOn({ setupMessageHandler }, 'setupMessageHandler');
      const setupExtensionHandlerSpy = jest.spyOn({ setupExtensionHandler }, 'setupExtensionHandler');
      
      initialize();
      
      expect(setupMessageHandlerSpy).toHaveBeenCalled();
      expect(setupExtensionHandlerSpy).toHaveBeenCalled();
      expect(utils.chromeAPI.storage.local.get).toHaveBeenCalled();
      
      // Restore spies
      setupMessageHandlerSpy.mockRestore();
      setupExtensionHandlerSpy.mockRestore();
    });

    it('should initialize browserTabId from storage if available', () => {
      // Make storage.get callback with valid data
      utils.chromeAPI.storage.local.get.mockImplementationOnce((key, callback) => {
        callback({ browserTabId: 789 });
      });
      
      initialize();
      
      // Execute the callback
      utils.chromeAPI.storage.local.get.mock.calls[0][1]({ browserTabId: 789 });
      
      expect(getBrowserTabId()).toBe(789);
    });
    
    it('should handle missing browserTabId in storage', () => {
      // Reset browserTabId
      setBrowserTabId(null);
      
      // Make storage.get callback with no data
      utils.chromeAPI.storage.local.get.mockImplementationOnce((key, callback) => {
        callback({});
      });
      
      initialize();
      
      // Execute the callback
      utils.chromeAPI.storage.local.get.mock.calls[0][1]({});
      
      // Should remain null if no data in storage
      expect(getBrowserTabId()).toBeNull();
    });
  });
  
  describe('getBrowserTabId and setBrowserTabId', () => {
    it('should get and set browserTabId', () => {
      // Reset the module state
      setBrowserTabId(null);
      
      expect(getBrowserTabId()).toBeNull();
      
      setBrowserTabId(789);
      
      expect(getBrowserTabId()).toBe(789);
      expect(utils.chromeAPI.storage.local.set).toHaveBeenCalledWith({ browserTabId: 789 });
    });
  });
});