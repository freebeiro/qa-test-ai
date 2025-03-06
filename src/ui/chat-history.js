/**
 * Class to manage chat history and display
 */
export class ChatHistory {
  /**
   * Initialize the chat history manager
   * @param {HTMLElement} containerElement - The container element for displaying chat history
   */
  constructor(containerElement) {
    this.chatHistory = [];
    this.containerElement = containerElement;
  }

  /**
   * Add an entry to the chat history
   * @param {Object} entry - The chat entry to add
   * @param {string} entry.command - The command text
   * @param {Array} [entry.screenshots] - Array of screenshot objects
   * @param {string} [entry.error] - Error message if command failed
   */
  addEntry(entry) {
    this.chatHistory.push({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString()
    });
    this.updateDisplay();
  }

  /**
   * Update the chat display with current history
   */
  updateDisplay() {
    this.containerElement.innerHTML = '';
    
    this.chatHistory.forEach(entry => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-entry';
      
      const commandDiv = document.createElement('div');
      commandDiv.className = 'command-text';
      commandDiv.textContent = `> ${entry.command}`;
      messageDiv.appendChild(commandDiv);

      if (entry.screenshots && entry.screenshots.length > 0) {
        const screenshotsDiv = document.createElement('div');
        screenshotsDiv.className = 'screenshots-container';
        
        entry.screenshots.forEach((screenshot, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'screenshot-wrapper';
          
          const img = document.createElement('img');
          img.src = screenshot.data;
          img.alt = `Screenshot ${idx + 1}`;
          img.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
          
          const controls = document.createElement('div');
          controls.className = 'screenshot-controls';
          
          const zoomButton = document.createElement('button');
          zoomButton.textContent = '🔍 View Full Size';
          zoomButton.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
          controls.appendChild(zoomButton);
          
          wrapper.appendChild(img);
          wrapper.appendChild(controls);
          screenshotsDiv.appendChild(wrapper);
        });
        
        messageDiv.appendChild(screenshotsDiv);
      }

      if (entry.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = entry.error;
        messageDiv.appendChild(errorDiv);
      }

      this.containerElement.appendChild(messageDiv);
    });

    this.containerElement.scrollTop = this.containerElement.scrollHeight;
  }

  /**
   * Show a fullscreen image
   * @param {string} imageUrl - The URL of the image to show
   */
  showFullscreenImage(imageUrl) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'screenshot-fullscreen';
    
    const img = document.createElement('img');
    img.src = imageUrl;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => fullscreenDiv.remove());
    
    fullscreenDiv.addEventListener('click', e => {
      if (e.target === fullscreenDiv) fullscreenDiv.remove();
    });
    
    fullscreenDiv.appendChild(img);
    fullscreenDiv.appendChild(closeButton);
    document.body.appendChild(fullscreenDiv);
  }

  /**
   * Get the current chat history
   * @returns {Array} - The chat history array
   */
  getHistory() {
    return [...this.chatHistory];
  }

  /**
   * Clear the chat history
   */
  clearHistory() {
    this.chatHistory = [];
    this.updateDisplay();
  }
} 