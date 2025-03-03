// UI interaction command handler functions
import { formatError, chromeAPI } from '../utils/index.js';

/**
 * Creates a script to scroll the page
 * @param {number} amount - The amount to scroll (positive for down, negative for up)
 * @returns {Object} - Script object with function and arguments
 */
export function getScrollScript(amount) {
  return {
    function: (amount) => {
      window.scrollBy(0, amount);
      return { success: true };
    },
    args: [amount]
  };
}

/**
 * Handle scrolling command
 * @param {Object} command - The scroll command object
 * @param {number} command.amount - The amount to scroll
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the scrolling operation
 */
export async function handleScrollCommand(command, browserTabId) {
  try {
    const script = getScrollScript(command.amount);
    await chromeAPI.scripting.executeScript({
      target: { tabId: browserTabId },
      function: script.function,
      args: script.args
    });
    
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

/**
 * Handle click command
 * @param {Object} command - The click command object
 * @param {string} command.text - The text of the element to click
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the click operation
 */
export async function handleClickCommand(command, browserTabId) {
  try {
    return await chromeAPI.tabs.sendMessage(browserTabId, { 
      type: 'CLICK', 
      text: command.text 
    });
  } catch (error) {
    return formatError(error);
  }
} 