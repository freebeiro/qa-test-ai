// Input command handler functions
import { getActiveTab, formatError, chromeAPI } from '../utils/index.js';

/**
 * Creates a script to select and fill an input element
 * @param {string} text - The text to enter in the input
 * @returns {Object} - Script object with function and arguments
 */
export function getInputSelectionScript(text) {
  return {
    function: (text) => {
      // Find the best input element
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]'));
      const input = document.activeElement && inputs.includes(document.activeElement) ? 
                    document.activeElement : 
                    inputs.find(i => {
                      const style = window.getComputedStyle(i);
                      return !(style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0');
                    });
                    
      if (!input) return { success: false, message: 'No input found' };
      
      input.focus();
      if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
        input.value = text;
      } else {
        input.textContent = text;
      }
      
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true };
    },
    args: [text]
  };
}

/**
 * Handle typing command
 * @param {Object} command - The typing command object
 * @param {string} command.text - The text to type
 * @param {string} [command.target] - Optional target element for typing
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the typing operation
 */
export async function handleTypingCommand(command, browserTabId) {
  try {
    if (!browserTabId) {
      return formatError(new Error("No browser tab is being controlled"));
    }
    
    // Get tab and focus window
    const tab = await getActiveTab(browserTabId);
    if (!tab) {
      return formatError(new Error("Failed to get active tab"));
    }
    
    // Handle targeting specific elements
    if (command.type === 'input_targeted') {
      const response = await chromeAPI.tabs.sendMessage(browserTabId, {
        type: 'TYPE_TARGETED',
        text: command.text,
        target: command.target
      });
      return response || { success: false, message: 'No response from content script' };
    }
    
    // Generic typing
    const script = getInputSelectionScript(command.text);
    const result = await chromeAPI.scripting.executeScript({
      target: { tabId: browserTabId },
      function: script.function,
      args: script.args
    });
    
    if (!result || !result[0]) {
      return { success: false, message: 'Script execution failed' };
    }
    
    return result[0].result || { success: false, message: 'Invalid script result' };
  } catch (error) {
    console.error("Failed to type text:", error);
    return formatError(error);
  }
}

/**
 * Creates a script to press the Enter key
 * @returns {Object} - Script object with function
 */
export function getPressEnterScript() {
  return {
    function: () => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter', 
        keyCode: 13, 
        bubbles: true 
      }));
      return { success: true };
    }
  };
}

/**
 * Handle press enter command
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the press enter operation
 */
export async function handlePressEnterCommand(browserTabId) {
  try {
    const script = getPressEnterScript();
    await chromeAPI.scripting.executeScript({
      target: { tabId: browserTabId },
      function: script.function
    });
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}