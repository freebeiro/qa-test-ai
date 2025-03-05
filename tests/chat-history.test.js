// Test file for chat history functionality
import '@testing-library/jest-dom';
import { ChatHistory } from '../src/ui/chat-history.js';

describe('ChatHistory', () => {
  let chatHistory;
  let containerElement;
  
  beforeEach(() => {
    // Set up document body
    document.body.innerHTML = '<div id="chat-container"></div>';
    containerElement = document.getElementById('chat-container');
    
    // Mock document.body.appendChild for the fullscreen feature
    document.body.appendChild = jest.fn();
    
    chatHistory = new ChatHistory(containerElement);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });
  
  describe('Initialization', () => {
    it('should initialize with empty chat history', () => {
      expect(chatHistory.chatHistory).toEqual([]);
      expect(chatHistory.containerElement).toBe(containerElement);
    });
  });
  
  describe('addEntry', () => {
    it('should add an entry to chat history', () => {
      const entry = { command: 'test command' };
      
      chatHistory.addEntry(entry);
      
      expect(chatHistory.chatHistory.length).toBe(1);
      expect(chatHistory.chatHistory[0].command).toBe('test command');
      expect(chatHistory.chatHistory[0].timestamp).toBeDefined();
    });
    
    it('should update the display after adding an entry', () => {
      const updateDisplaySpy = jest.spyOn(chatHistory, 'updateDisplay');
      const entry = { command: 'test command' };
      
      chatHistory.addEntry(entry);
      
      expect(updateDisplaySpy).toHaveBeenCalled();
    });
  });
  
  describe('updateDisplay', () => {
    it('should clear container and create elements for each chat entry', () => {
      // Add two entries
      chatHistory.addEntry({ command: 'command 1' });
      chatHistory.addEntry({ command: 'command 2', error: 'Error message' });
      
      // Clear spy history from addEntry calls
      jest.clearAllMocks();
      
      // Call updateDisplay manually
      chatHistory.updateDisplay();
      
      // Check DOM structure
      const chatEntries = containerElement.querySelectorAll('.chat-entry');
      expect(chatEntries.length).toBe(2);
      
      // Check command text
      const commandTexts = containerElement.querySelectorAll('.command-text');
      expect(commandTexts[0].textContent).toBe('> command 1');
      expect(commandTexts[1].textContent).toBe('> command 2');
      
      // Check error message
      const errorMessage = containerElement.querySelector('.error-message');
      expect(errorMessage).not.toBeNull();
      expect(errorMessage.textContent).toBe('Error message');
    });
    
    it('should create screenshot elements when screenshots are present', () => {
      chatHistory.addEntry({
        command: 'screenshot command',
        screenshots: [
          { data: 'data:image/png;base64,abc123', caption: 'Test Screenshot' }
        ]
      });
      
      // Check screenshot container
      const screenshotContainer = containerElement.querySelector('.screenshots-container');
      expect(screenshotContainer).not.toBeNull();
      
      // Check image
      const image = containerElement.querySelector('img');
      expect(image).not.toBeNull();
      expect(image.src).toContain('data:image/png;base64,abc123');
      
      // Test clicking the image for fullscreen view
      const clickEvent = new MouseEvent('click');
      image.dispatchEvent(clickEvent);
      
      // Test clicking the zoom button
      const zoomButton = containerElement.querySelector('.screenshot-controls button');
      expect(zoomButton).not.toBeNull();
      zoomButton.click();
    });
  });
  
  describe('showFullscreenImage', () => {
    it('should create a fullscreen div with image and close button', () => {
      // Mock document.body.appendChild to capture the fullscreen div
      let fullscreenDiv;
      document.body.appendChild = jest.fn(element => {
        fullscreenDiv = element;
      });
      
      // Call the method
      chatHistory.showFullscreenImage('data:image/png;base64,test');
      
      // Verify the fullscreen div was created correctly
      expect(fullscreenDiv).toBeDefined();
      expect(fullscreenDiv.className).toBe('screenshot-fullscreen');
      
      // Verify the image
      const img = fullscreenDiv.querySelector('img');
      expect(img).toBeDefined();
      expect(img.src).toContain('data:image/png;base64,test');
      
      // Verify the close button
      const closeButton = fullscreenDiv.querySelector('.close-button');
      expect(closeButton).toBeDefined();
      
      // Test closing by clicking the close button
      const removeStub = jest.fn();
      fullscreenDiv.remove = removeStub;
      closeButton.click();
      expect(removeStub).toHaveBeenCalled();
      
      // Test clicking on the background
      removeStub.mockClear();
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', {value: fullscreenDiv});
      fullscreenDiv.dispatchEvent(clickEvent);
      expect(removeStub).toHaveBeenCalled();
    });
  });

  describe('getHistory and clearHistory', () => {
    it('should return a copy of the chat history array', () => {
      chatHistory.addEntry({ command: 'command 1' });
      chatHistory.addEntry({ command: 'command 2' });
      
      const history = chatHistory.getHistory();
      
      expect(history.length).toBe(2);
      expect(history).not.toBe(chatHistory.chatHistory); // Should be a different array instance
    });
    
    it('should clear the chat history', () => {
      chatHistory.addEntry({ command: 'command 1' });
      chatHistory.addEntry({ command: 'command 2' });
      
      const updateDisplaySpy = jest.spyOn(chatHistory, 'updateDisplay');
      chatHistory.clearHistory();
      
      expect(chatHistory.chatHistory.length).toBe(0);
      expect(updateDisplaySpy).toHaveBeenCalled();
    });
  });
});