// Core background functionality
import { captureScreenshot, wait, formatError, chromeAPI } from '../utils/index.js';
import { 
  handleTypingCommand,
  handlePressEnterCommand,
  handleScrollCommand,
  handleClickCommand,
  handleNavigationCommand,
  handleBackCommand,
  handleForwardCommand
} from '../commands/index.js';

// State tracking
let browserTabId = null;
let navigationHistory = {};

// Command handler mapping - exported for better testability
export const commandHandlers = {
  'navigation': handleNavigationCommand,
  'input': handleTypingCommand,
  'input_targeted': handleTypingCommand,
  'click': handleClickCommand,
  'scroll': handleScrollCommand,
  'back': handleBackCommand,
  'forward': handleForwardCommand,
  'press_enter': handlePressEnterCommand
};

// Function to handle commands
export async function handleCommand(command) {
  try {
    // Get the handler for this command type
    const handler = commandHandlers[command.type];
    
    if (!handler) {
      return { success: false, error: 'Unknown command type' };
    }
    
    // For navigation commands, store the URL in our history tracker
    if (command.type === 'navigation' && command.url) {
      const { trackNavigation } = await import('../utils/background-utils.js');
      trackNavigation(browserTabId, command.url);
    }
    
    // Execute the handler
    const result = await handler(command, browserTabId);
    
    // Wait for page to settle
    await wait(1000);
    
    // Capture screenshot
    const screenshot = await captureScreenshot(browserTabId);
    
    return { 
      success: result.success, 
      message: result.message,
      error: result.error,
      screenshot
    };
  } catch (error) {
    console.error('Command execution failed:', error);
    return formatError(error);
  }
}

// Setup message handlers
export function setupMessageHandler() {
  chromeAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'EXECUTE_COMMAND') {
      handleCommand(request.command)
        .then(result => sendResponse(result))
        .catch(error => sendResponse(formatError(error)));
      return true;
    }
  });
}

// Setup extension click handler
export function setupExtensionHandler() {
  chromeAPI.action.onClicked.addListener(async (tab) => {
    browserTabId = tab?.id;
    
    await chromeAPI.windows.create({
      url: chromeAPI.runtime.getURL('popup.html'),
      type: 'popup',
      width: 500,
      height: 700
    });
    
    chromeAPI.storage.local.set({ browserTabId });
  });
}

// Initialize functions - exported for testability
export function initialize() {
  setupMessageHandler();
  setupExtensionHandler();
  
  console.log('Background core initialized');
}

// Call initialize
initialize();

// Export browser tab ID for testing purposes
export function getBrowserTabId() {
  return browserTabId;
}

// Set browser tab ID (useful for testing)
export function setBrowserTabId(tabId) {
  browserTabId = tabId;
}