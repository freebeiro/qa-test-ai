document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup loaded');
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendButton = document.querySelector('button');
  let chatHistory = [];

  // Wait for navigation and page load
  async function waitForPageLoad() {
    console.log('Waiting for page load...');
    return new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Take screenshot using chrome.tabs API
  async function takeScreenshot() {
    console.log('Taking screenshot...');
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      console.log('Active tab:', tab.id);
      
      // Wait for any animations/loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await chrome.tabs.captureVisibleTab(null, {
        format: 'png',
        quality: 100
      });
      
      console.log('Screenshot taken successfully');
      return dataUrl;
    } catch (error) {
      console.error('Screenshot failed:', error);
      throw error;
    }
  }

  // Add message to chat UI
  function addToChat(text, screenshot = null) {
    console.log('Adding to chat:', {text, hasScreenshot: !!screenshot});
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    msgDiv.textContent = text;
    chat.appendChild(msgDiv);

    if (screenshot) {
      const img = document.createElement('img');
      img.src = screenshot;
      img.className = 'screenshot';
      chat.appendChild(img);
    }

    chatHistory.push({text, screenshot});
    chat.scrollTop = chat.scrollHeight;
  }

  // Handle user commands
  async function handleCommand(command) {
    console.log('Executing command:', command);
    
    try {
      // Show user command
      addToChat(`> ${command}`);

      // Execute command
      if (command.toLowerCase().includes('go to')) {
        const url = command.split('go to ')[1].trim();
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;
        
        // Navigate
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        await chrome.tabs.update(tab.id, {url: fullUrl});
        
        // Wait for load
        await waitForPageLoad();
        
        // Take screenshot
        const screenshot = await takeScreenshot();
        
        // Add result to chat
        addToChat(`Navigated to ${url}`, screenshot);
      }
    } catch (error) {
      console.error('Command failed:', error);
      addToChat(`Error: ${error.message}`);
    }
  }

  // Handle button click
  sendButton.addEventListener('click', async () => {
    const command = input.value.trim();
    if (!command) return;
    
    input.value = '';
    await handleCommand(command);
  });
});