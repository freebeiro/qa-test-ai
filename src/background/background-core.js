// Core background functionality
import { captureScreenshot, wait, formatError, chromeAPI } from '../utils/index.js';
import { 
  handleTypingCommand,
  handlePressEnterCommand,
  handleScrollCommand,
  handleClickCommand,
  handleNavigationCommand,
  handleBackCommand,
  handleForwardCommand,
  handleCoordinateClickCommand,
  handleCaptchaCommand
} from '../commands/index.js';

// State tracking
let browserTabId = null;

// Command handler mapping - exported for better testability
export const commandHandlers = {
  'navigation': handleNavigationCommand,
  'input': handleTypingCommand,
  'input_targeted': handleTypingCommand,
  'click': handleClickCommand,
  'click_at': handleCoordinateClickCommand,
  'click_coordinates': handleCoordinateClickCommand,
  'click_position': handleCoordinateClickCommand,
  'scroll': handleScrollCommand,
  'back': handleBackCommand,
  'forward': handleForwardCommand,
  'press_enter': handlePressEnterCommand,
  'captcha': handleCaptchaCommand,
  'verify': handleCaptchaCommand,
  'verify_human': handleCaptchaCommand
};

// Function to handle commands
export async function handleCommand(command) {
  try {
    console.log('Background handling command:', command);
    
    // Get the handler for this command type
    const handler = commandHandlers[command.type];
    
    if (!handler) {
      console.error('Unknown command type:', command.type);
      return { success: false, error: `Unknown command type: ${command.type}` };
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
      console.log('Received EXECUTE_COMMAND with command:', request.command);
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
    browserTabId = tab?.id ? parseInt(tab.id) : null;
    
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
  
  // Try to retrieve browserTabId from storage on initialization
  chromeAPI.storage.local.get('browserTabId', (data) => {
    if (data && data.browserTabId) {
      browserTabId = parseInt(data.browserTabId);
      console.log('Initialized browserTabId from storage:', browserTabId);
    }
  });
  
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
  // Also update in storage for persistence
  chromeAPI.storage.local.set({ browserTabId });
}