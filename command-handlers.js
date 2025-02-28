// Command handler functions
import { getActiveTab, wait, formatUrl, formatError } from './background-utils.js';
import chromeAPI from './chrome-api.js';

// Input selection script - exported for testability
export function getInputSelectionScript(text) {
  return {
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
    args: [text]
  };
}

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
      return await chromeAPI.tabs.sendMessage(browserTabId, {
        type: 'TYPE_TARGETED',
        text: command.text,
        target: command.target
      });
    }
    
    // Generic typing
    const script = getInputSelectionScript(command.text);
    const result = await chromeAPI.scripting.executeScript({
      target: { tabId: browserTabId },
      function: script.function,
      args: script.args
    });
    
    return { success: true, result: result[0]?.result };
  } catch (error) {
    console.error("Failed to type text:", error);
    return formatError(error);
  }
}

// Scroll script - exported for testability
export function getScrollScript(amount) {
  return {
    function: (amount) => {
      window.scrollBy(0, amount);
      return { success: true };
    },
    args: [amount]
  };
}

// Handle scrolling
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

// Handle navigation commands
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

// Handle click command
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

// Handle back navigation
export async function handleBackCommand(browserTabId) {
  try {
    await chromeAPI.tabs.goBack(browserTabId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

// Handle forward navigation
export async function handleForwardCommand(browserTabId) {
  try {
    await chromeAPI.tabs.goForward(browserTabId);
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}

// Press enter script - exported for testability
export function getPressEnterScript() {
  return {
    function: () => {
      document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { 
        key: 'Enter', 
        code: 'Enter', 
        keyCode: 13, 
        bubbles: true 
      }));
      return { success: true };
    }
  };
}

// Handle press enter
export async function handlePressEnterCommand(browserTabId) {
  try {
    const script = getPressEnterScript();
    await chromeAPI.scripting.executeScript({
      target: { tabId: browserTabId },
      function: script.function
    });
    return { success: true };
  } catch (error) {
    return formatError(error);
  }
}