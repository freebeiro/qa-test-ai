// Utility functions for background scripts
import chromeAPI from './chrome-api.js';

// Navigation history storage
const navigationHistoryMap = {};
const currentPositionMap = {};

// Track navigation history for each tab
export function trackNavigation(tabId, url) {
  // Initialize history array for this tab if it doesn't exist
  if (!navigationHistoryMap[tabId]) {
    navigationHistoryMap[tabId] = [];
    currentPositionMap[tabId] = 0; // Initialize to 0 instead of -1
  }
  
  // If we're not at the end of the history, truncate the history
  if (currentPositionMap[tabId] < navigationHistoryMap[tabId].length - 1) {
    navigationHistoryMap[tabId] = navigationHistoryMap[tabId].slice(0, currentPositionMap[tabId] + 1);
  }
  
  // Add URL to history
  navigationHistoryMap[tabId].push(url);
  currentPositionMap[tabId] = navigationHistoryMap[tabId].length - 1;
  
  console.log(`Navigation history for tab ${tabId}:`, navigationHistoryMap[tabId]);
  console.log(`Current position for tab ${tabId}:`, currentPositionMap[tabId]);
  
  return navigationHistoryMap[tabId]; // Return array instead of map
}

// Get navigation history for a tab
export function getNavigationHistory(tabId) {
  return navigationHistoryMap[tabId] || [];
}

// Get current position in navigation history for a tab
export function getCurrentPosition(tabId) {
  return currentPositionMap[tabId] || 0;
}

// Set current position in navigation history for a tab
export function setCurrentPosition(tabId, position) {
  if (navigationHistoryMap[tabId] && position >= 0 && position < navigationHistoryMap[tabId].length) {
    currentPositionMap[tabId] = position;
    return true;
  }
  return false;
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