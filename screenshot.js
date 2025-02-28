// Screenshot functionality
import { getActiveTab, wait } from './background-utils.js';
import chromeAPI from './chrome-api.js';

// Take screenshot of the current tab
export async function captureScreenshot(tabId) {
  if (!tabId) return null;
  
  try {
    const tab = await getActiveTab(tabId);
    if (!tab) return null;
    
    // Wait for UI to settle
    await wait(500);
    
    return await chromeAPI.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100
    });
  } catch (error) {
    console.error('Screenshot failed:', error);
    return null;
  }
}