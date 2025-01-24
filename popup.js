document.addEventListener('DOMContentLoaded', () => {
  const chat = document.getElementById('chat');
  const input = document.getElementById('input');
  const generateBtn = document.getElementById('generate-report');
  let chatHistory = [];

  async function captureScreenshot() {
    try {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
      const response = await chrome.tabs.sendMessage(tab.id, {action: 'captureScreenshot'});
      return response.screenshot;
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      return null;
    }
  }

  async function handleUITarsRequest(instruction, screenshot) {
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: "ui-tars",
        messages: [{
          role: "user",
          content: [
            {type: "text", text: instruction},
            {type: "image_url", image_url: {url: screenshot}}
          ]
        }],
        temperature: 0.1,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`UI-TARS Error: ${response.status}`);
    }
    return await response.json();
  }

  async function generatePDFReport() {
    const response = await fetch('http://localhost:8001/generate-pdf', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_history: chatHistory})
    });

    if (!response.ok) {
      throw new Error('PDF generation failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qa_report.pdf';
    a.click();
  }

  input.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      const instruction = input.value;
      input.value = '';

      const userMsg = document.createElement('div');
      userMsg.className = 'message user';
      userMsg.textContent = instruction;
      chat.appendChild(userMsg);

      const loadingMsg = document.createElement('div');
      loadingMsg.className = 'message bot loading';
      loadingMsg.textContent = 'Processing...';
      chat.appendChild(loadingMsg);

      try {
        const screenshot = await captureScreenshot();
        const response = await handleUITarsRequest(instruction, screenshot);
        
        chatHistory.push({
          role: 'user',
          content: instruction,
          screenshot: screenshot
        });

        chatHistory.push({
          role: 'assistant',
          content: response.choices[0].message.content
        });

        loadingMsg.className = 'message bot';
        loadingMsg.textContent = response.choices[0].message.content;
      } catch (error) {
        loadingMsg.className = 'message error';
        loadingMsg.textContent = `Error: ${error.message}`;
      }

      chat.scrollTop = chat.scrollHeight;
    }
  });

  generateBtn.addEventListener('click', async () => {
    try {
      await generatePDFReport();
    } catch (error) {
      console.error('PDF generation failed:', error);
      const errorMsg = document.createElement('div');
      errorMsg.className = 'message error';
      errorMsg.textContent = `Failed to generate PDF: ${error.message}`;
      chat.appendChild(errorMsg);
    }
  });
});