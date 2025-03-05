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