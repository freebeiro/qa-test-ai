// Navigation command handler functions
import { formatUrl, formatError, chromeAPI } from '../utils/index.js';

/**
 * Handle navigation commands
 * @param {Object} command - The navigation command object
 * @param {string} command.url - The URL to navigate to
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the navigation operation
 */
export async function handleNavigationCommand(command, browserTabId) {
  try {
    const url = formatUrl(command.url);
    await chromeAPI.tabs.update(browserTabId, { url });
    
    return new Promise(resolve => {
      const listener = (tabId, changeInfo) => {
        if (tabId === browserTabId && changeInfo.status === 'complete') {
          chromeAPI.tabs.onUpdated.removeListener(listener);
          resolve({ success: true });
        }
      };
      chromeAPI.tabs.onUpdated.addListener(listener);
    });
  } catch (error) {
    return formatError(error);
  }
}

/**
 * Handle back navigation
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the back navigation operation
 */
export async function handleBackCommand(browserTabId) {
  try {
    // Ensure browserTabId is a number
    const tabId = typeof browserTabId === 'number' ? browserTabId : null;
    const result = await chromeAPI.tabs.goBack(tabId);
    return result;
  } catch (error) {
    console.error("Back navigation error:", error);
    return formatError(error);
  }
}

/**
 * Handle forward navigation
 * @param {number} browserTabId - The ID of the browser tab
 * @returns {Promise<Object>} - Result of the forward navigation operation
 */
export async function handleForwardCommand(browserTabId) {
  try {
    // Ensure browserTabId is a number
    const tabId = typeof browserTabId === 'number' ? browserTabId : null;
    const result = await chromeAPI.tabs.goForward(tabId);
    return result;
  } catch (error) {
    console.error("Forward navigation error:", error);
    return formatError(error);
  }
} 