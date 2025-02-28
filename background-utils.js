// Utility functions for background scripts
import chromeAPI from './chrome-api.js';

// Get the active tab
export async function getActiveTab(tabId) {
  try {
    const tab = await chromeAPI.tabs.get(tabId);
    await chromeAPI.windows.update(tab.windowId, { focused: true });
    await chromeAPI.tabs.update(tabId, { active: true });
    return tab;
  } catch (error) {
    console.error("Error getting active tab:", error);
    return null;
  }
}

// Promise-based timeout
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Format URL to ensure it has a protocol
export function formatUrl(url) {
  return url.includes('://') ? url : `https://${url}`;
}

// Create standardized error response
export function formatError(error) {
  return {
    success: false,
    error: error.message || 'Unknown error'
  };
}