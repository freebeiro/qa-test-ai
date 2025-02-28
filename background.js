// State tracking
let browserTabId = null;
let qaWindow = null;

// Handle typing command
async function handleTypingCommand(command) {
  try {
    if (!browserTabId) {
      throw new Error("No browser tab is being controlled");
    }
    
    // Get tab and focus window
    const tab = await chrome.tabs.get(browserTabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(browserTabId, { active: true });
    
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
async function handleScrollCommand(command) {
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
async function handleNavigationCommand(command) {
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

// Take screenshot
async function captureScreenshot() {
  if (!browserTabId) return null;
  
  try {
    const tab = await chrome.tabs.get(browserTabId);
    await chrome.windows.update(tab.windowId, { focused: true });
    await chrome.tabs.update(browserTabId, { active: true });
    
    // Wait for UI to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'png',
      quality: 100
    });
  } catch (error) {
    console.error('Screenshot failed:', error);
    return null;
  }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'EXECUTE_COMMAND') {
    handleCommand(request.command)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ 
        success: false, 
        error: error.message 
      }));
    return true;
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  browserTabId = tab?.id;
  
  qaWindow = await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 500,
    height: 700
  });
  
  chrome.storage.local.set({ browserTabId });
});

// Function to handle commands
async function handleCommand(command) {
  try {
    // Handle different command types
    let result;
    
    switch(command.type) {
      case 'navigation':
        result = await handleNavigationCommand(command);
        break;
      case 'input':
      case 'input_targeted':
        result = await handleTypingCommand(command);
        break;
      case 'click':
        result = await chrome.tabs.sendMessage(browserTabId, { 
          type: 'CLICK', 
          text: command.text 
        });
        break;
      case 'scroll':
        result = await handleScrollCommand(command);
        break;
      case 'back':
        await chrome.tabs.goBack(browserTabId);
        result = { success: true };
        break;
      case 'forward':
        await chrome.tabs.goForward(browserTabId);
        result = { success: true };
        break;
      case 'press_enter':
        await chrome.scripting.executeScript({
          target: { tabId: browserTabId },
          function: () => {
            document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
            return { success: true };
          }
        });
        result = { success: true };
        break;
      default:
        return { success: false, error: 'Unknown command type' };
    }
    
    // Wait for page to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Capture screenshot
    const screenshot = await captureScreenshot();
    
    return { 
      success: result.success, 
      message: result.message,
      error: result.error,
      screenshot
    };
  } catch (error) {
    console.error('Command execution failed:', error);
    return { success: false, error: error.message };
  }
}

// Initialize
console.log('Background script initialized');
