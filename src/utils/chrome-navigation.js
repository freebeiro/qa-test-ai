// Chrome navigation helper functions
import { getNavigationHistory, getCurrentPosition, setCurrentPosition } from './background-utils.js';

/**
 * Creates a simplified wrapper for Chrome navigation functions that matches
 * the expected Chrome Extension API signature exactly
 * 
 * @param {Function} method - The Chrome API navigation method (chrome.tabs.goBack or chrome.tabs.goForward)
 * @param {number} tabId - Optional tab ID to navigate in a specific tab
 * @returns {Promise} - Promise that resolves when navigation completes or rejects on failure
 */
export function createNavigationHandler(method, tabId) {
  return new Promise((resolve, reject) => {
    try {
      // Determine if this is back or forward navigation
      const isForward = method === chrome.tabs.goForward;
      
      // Try to use custom history tracking if available
      if (tabId && typeof tabId === 'number') {
        // Get history for this tab using the getNavigationHistory function
        let historyStack = getNavigationHistory(tabId);
        let currentPosition = getCurrentPosition(tabId);
        
        console.log(`Navigation history for tab ${tabId}:`, historyStack);
        console.log(`Current position for tab ${tabId}:`, currentPosition);
        
        if (historyStack && historyStack.length > 1) {
          // Handle back navigation with custom history
          if (!isForward && currentPosition > 0) {
            let newPosition = currentPosition - 1;
            let prevUrl = historyStack[newPosition];
            
            console.log(`Navigating back to ${prevUrl} (position ${newPosition})`);
            
            // Update the current position
            setCurrentPosition(tabId, newPosition);
            
            chrome.tabs.update(tabId, { url: prevUrl }, () => {
              if (chrome.runtime.lastError) {
                console.warn("Navigation failed:", chrome.runtime.lastError);
                resolve({ success: false, error: chrome.runtime.lastError.message });
              } else {
                resolve({ success: true });
              }
            });
            return; // Exit early, we've handled it
          }
          
          // Handle forward navigation with custom history
          if (isForward && currentPosition < historyStack.length - 1) {
            let newPosition = currentPosition + 1;
            let nextUrl = historyStack[newPosition];
            
            console.log(`Navigating forward to ${nextUrl} (position ${newPosition})`);
            
            // Update the current position
            setCurrentPosition(tabId, newPosition);
            
            chrome.tabs.update(tabId, { url: nextUrl }, () => {
              if (chrome.runtime.lastError) {
                console.warn("Navigation failed:", chrome.runtime.lastError);
                resolve({ success: false, error: chrome.runtime.lastError.message });
              } else {
                resolve({ success: true });
              }
            });
            return; // Exit early, we've handled it
          }
        }
      }
      
      // Fall back to using the browser's history via content script
      if (tabId && typeof tabId === 'number') {
        console.log(`Using browser history for ${isForward ? 'forward' : 'back'} navigation`);
        chrome.scripting.executeScript({
          target: { tabId },
          func: (goForward) => { 
            if (goForward) {
              window.history.forward();
            } else {
              window.history.back();
            }
            return true;
          },
          args: [isForward]
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.warn("No navigation history available", chrome.runtime.lastError);
            resolve({ success: true, warning: "No navigation history available" });
          } else {
            resolve({ success: true });
          }
        });
      } else {
        // Fallback to less reliable method if no tabId
        console.log(`Using fallback method for ${isForward ? 'forward' : 'back'} navigation`);
        method(() => {
          if (chrome.runtime.lastError) {
            console.warn("No navigation history available", chrome.runtime.lastError);
            resolve({ success: true, warning: "No navigation history available" });
          } else {
            resolve({ success: true });
          }
        });
      }
    } catch (error) {
      console.error("Navigation method call failed:", error);
      reject(error);
    }
  });
}