document.addEventListener('DOMContentLoaded', () => {
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const sendButton = document.querySelector('button');

  async function handleCommand(command) {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const tab = tabs[0];

    // Handle navigation
    if (command.toLowerCase().includes('navigate to') || command.toLowerCase().includes('go to')) {
      const url = command.split(' ').pop();
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      await chrome.tabs.update(tab.id, {url: fullUrl});
      return `Navigated to ${url}`;
    }

    // Handle clicks
    if (command.toLowerCase().includes('click')) {
      await chrome.tabs.sendMessage(tab.id, {action: 'click', selector: 'button, a, input[type="submit"]'});
      return 'Clicked element';
    }

    // Handle typing
    if (command.toLowerCase().includes('type')) {
      const text = command.split('type ')[1];
      await chrome.tabs.sendMessage(tab.id, {action: 'type', selector: 'input', text});
      return `Typed: ${text}`;
    }

    return 'Available commands: navigate to [url], go to [url], click [element], type [text]';
  }

  sendButton.addEventListener('click', async () => {
    const text = input.value;
    if (!text) return;

    const userMsg = document.createElement('div');
    userMsg.textContent = text;
    chat.appendChild(userMsg);

    try {
      const result = await handleCommand(text);
      const responseMsg = document.createElement('div');
      responseMsg.textContent = result;
      chat.appendChild(responseMsg);
    } catch (error) {
      const errorMsg = document.createElement('div');
      errorMsg.textContent = error.message;
      errorMsg.style.color = 'red';
      chat.appendChild(errorMsg);
    }

    input.value = '';
  });
});