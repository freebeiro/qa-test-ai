// Utility functions for background scripts

// Get the active tab
export async function getActiveTab(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(tabId, { active: true });
    return tab;
  } catch (error) {
    console.error("Error getting active tab:", error);
    return null;
  }
}

// Promise-based timeout
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));