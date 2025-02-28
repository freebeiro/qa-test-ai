// Core background functionality
import { captureScreenshot } from './screenshot.js';
import { wait, formatError } from './background-utils.js';
import { 
  handleTypingCommand,
  handleScrollCommand,
  handleNavigationCommand,
  handleClickCommand,
  handleBackCommand,
  handleForwardCommand,
  handlePressEnterCommand
} from './command-handlers.js';
import chromeAPI from './chrome-api.js';

// State tracking
let browserTabId = null;
let qaWindow = null;

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
    
    qaWindow = await chromeAPI.windows.create({
      url: chromeAPI.runtime.getURL('popup.html'),
      type: 'popup',
      width: 500,
      height: 700
    });
    
    chromeAPI.storage.local.set({ browserTabId });
  });
}

// Initialize the core functionality
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