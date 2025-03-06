// Navigation command handler functions
import { formatUrl, formatError, chromeAPI, trackNavigation } from '../utils/index.js';

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
    
    // Track this URL in our navigation history
    trackNavigation(browserTabId, url);
    
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
export async function handleBackCommand(command, browserTabId) {
  try {
    // Ensure browserTabId is a valid numeric value
    const tabId = typeof browserTabId === 'number' ? browserTabId : 
               (browserTabId && !isNaN(parseInt(browserTabId)) ? parseInt(browserTabId) : null);
    
    // Log that we're attempting to navigate back
    console.log(`Attempting to navigate back for tab ${tabId}`);
    
    const result = await chromeAPI.tabs.goBack(tabId);
    
    // Log the result
    console.log(`Back navigation result:`, result);
    
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
export async function handleForwardCommand(command, browserTabId) {
  try {
    // Ensure browserTabId is a valid numeric value
    const tabId = typeof browserTabId === 'number' ? browserTabId : 
                (browserTabId && !isNaN(parseInt(browserTabId)) ? parseInt(browserTabId) : null);
    
    // Log that we're attempting to navigate forward
    console.log(`Attempting to navigate forward for tab ${tabId}`);
    
    const result = await chromeAPI.tabs.goForward(tabId);
    
    // Log the result
    console.log(`Forward navigation result:`, result);
    
    return result;
  } catch (error) {
    console.error("Forward navigation error:", error);
    return formatError(error);
  }
} 