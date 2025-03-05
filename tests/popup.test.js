// Test file for the popup.js entry point - outcome focused
import '../src/ui/popup.js';

describe('Popup Script', () => {
  beforeEach(() => {
    // Set up document body
    document.body.innerHTML = `
      <div id="app">
        <div class="chat-container" id="screenshot"></div>
        <div class="input-group">
          <textarea id="command-input"></textarea>
          <button id="send-button">Send</button>
        </div>
      </div>
    `;
    
    // Mock DOM content loaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should export QAInterface', () => {
    // Check if QAInterface is exported
    const exportedModule = require('../src/ui/popup.js');
    expect(exportedModule).toHaveProperty('QAInterface');
  });
});