// Utility functions for background scripts
import chromeAPI from './chrome-api.js';

// Navigation history storage
const navigationHistoryMap = {};

// Track navigation history for each tab
export function trackNavigation(tabId, url) {
  // Initialize history array for this tab if it doesn't exist
  if (!navigationHistoryMap[tabId]) {
    navigationHistoryMap[tabId] = [];
  }
  
  // Add URL to history
  navigationHistoryMap[tabId].push(url);
  console.log(`Navigation history for tab ${tabId}:`, navigationHistoryMap[tabId]);
  
  return navigationHistoryMap;
}

// Get navigation history for a tab
export function getNavigationHistory(tabId) {
  return navigationHistoryMap[tabId] || [];
}

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