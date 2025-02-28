// Command handler functions
import { getActiveTab, wait } from './background-utils.js';

// Handle typing command
export async function handleTypingCommand(command, browserTabId) {
  try {
    if (!browserTabId) {
      throw new Error("No browser tab is being controlled");
    }
    
    // Get tab and focus window
    await getActiveTab(browserTabId);
    
    // Handle targeting specific elements
    if (command.type === 'input_targeted') {
      return await chrome.tabs.sendMessage(browserTabId, {
        type: 'TYPE_TARGETED',
        text: command.text,
        target: command.target
      });
    }
    
    // Generic typing
    const result = await chrome.scripting.executeScript({
      target: { tabId: browserTabId },
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
      args: [command.text]
    });
    
    return { success: true, result: result[0]?.result };
  } catch (error) {
    console.error("Failed to type text:", error);
    return { success: false, error: error.message };
  }
}

// Handle scrolling
export async function handleScrollCommand(command, browserTabId) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: browserTabId },
      function: (amount) => {
        window.scrollBy(0, amount);
        return { success: true };
      },
      args: [command.amount]
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle navigation commands
export async function handleNavigationCommand(command, browserTabId) {
  try {
    const url = command.url.includes('://') ? command.url : `https://${command.url}`;
    await chrome.tabs.update(browserTabId, { url });
    
    return new Promise(resolve => {
      const listener = (tabId, changeInfo) => {
        if (tabId === browserTabId && changeInfo.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve({ success: true });
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle click command
export async function handleClickCommand(command, browserTabId) {
  try {
    return await chrome.tabs.sendMessage(browserTabId, { 
      type: 'CLICK', 
      text: command.text 
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle back navigation
export async function handleBackCommand(browserTabId) {
  try {
    await chrome.tabs.goBack(browserTabId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle forward navigation
export async function handleForwardCommand(browserTabId) {
  try {
    await chrome.tabs.goForward(browserTabId);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Handle press enter
export async function handlePressEnterCommand(browserTabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: browserTabId },
      function: () => {
        document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { 
          key: 'Enter', 
          code: 'Enter', 
          keyCode: 13, 
          bubbles: true 
        }));
        return { success: true };
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}