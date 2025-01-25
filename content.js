chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  const actions = {
    navigate: () => window.location.href = request.url,
    click: () => document.querySelector(request.selector)?.click(),
    type: () => {
      const input = document.querySelector(request.selector);
      if (input) input.value = request.text;
    },
    screenshot: async () => {
      try {
        const canvas = await html2canvas(document.documentElement, {
          logging: false,
          useCORS: true
        });
        sendResponse({ screenshot: canvas.toDataURL() });
      } catch (error) {
        console.error('Screenshot error:', error);
        sendResponse({ error: error.message });
      }
    }
  };

  if (request.action === 'screenshot') {
    actions.screenshot();
    return true;
  }

  actions[request.action]?.();
  sendResponse({ success: true });
  return true;
});