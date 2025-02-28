// Core background functionality
import { captureScreenshot } from './screenshot.js';
import { wait } from './background-utils.js';
import { 
  handleTypingCommand,
  handleScrollCommand,
  handleNavigationCommand,
  handleClickCommand,
  handleBackCommand,
  handleForwardCommand,
  handlePressEnterCommand
} from './command-handlers.js';

// State tracking
let browserTabId = null;
let qaWindow = null;

// Function to handle commands
export async function handleCommand(command) {
  try {
    // Handle different command types
    let result;
    
    switch(command.type) {
      case 'navigation':
        result = await handleNavigationCommand(command, browserTabId);
        break;
      case 'input':
      case 'input_targeted':
        result = await handleTypingCommand(command, browserTabId);
        break;
      case 'click':
        result = await handleClickCommand(command, browserTabId);
        break;
      case 'scroll':
        result = await handleScrollCommand(command, browserTabId);
        break;
      case 'back':
        result = await handleBackCommand(browserTabId);
        break;
      case 'forward':
        result = await handleForwardCommand(browserTabId);
        break;
      case 'press_enter':
        result = await handlePressEnterCommand(browserTabId);
        break;
      default:
        return { success: false, error: 'Unknown command type' };
    }
    
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
    return { success: false, error: error.message };
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXECUTE_COMMAND') {
    handleCommand(request.command)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message 
      }));
    return true;
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  browserTabId = tab?.id;
  
  qaWindow = await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 500,
    height: 700
  });
  
  chrome.storage.local.set({ browserTabId });
});

// Initialize
console.log('Background core initialized');

// Export browser tab ID for testing purposes
export function getBrowserTabId() {
  return browserTabId;
}

// Set browser tab ID (useful for testing)
export function setBrowserTabId(tabId) {
  browserTabId = tabId;
}