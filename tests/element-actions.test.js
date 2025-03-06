// Test file for element actions
import { findAndClickElement, findAndTypeInElement } from '../src/content/element-actions.js';
import { findElementByText, findInputByText } from '../src/content/element-finder.js';
import { wait, dispatchInputEvents } from '../src/content/content-utils.js';

// Mock dependencies
jest.mock('../src/content/element-finder.js', () => ({
  findElementByText: jest.fn(),
  findInputByText: jest.fn()
}));

jest.mock('../src/content/content-utils.js', () => ({
  wait: jest.fn().mockResolvedValue(undefined),
  dispatchInputEvents: jest.fn()
}));

describe('Element Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation();
  });
  
  describe('findAndClickElement', () => {
    it('should find an element and click it', async () => {
      // Mock element
      const mockElement = {
        scrollIntoView: jest.fn(),
        click: jest.fn()
      };
      
      // Set up mock to return the element
      findElementByText.mockReturnValueOnce(mockElement);
      
      // Call the function
      const result = await findAndClickElement('Submit');
      
      // Verify the element was found and clicked
      expect(findElementByText).toHaveBeenCalledWith('Submit');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      expect(wait).toHaveBeenCalledWith(300);
      expect(mockElement.click).toHaveBeenCalled();
      expect(result).toBe(true);
    });
    
    it('should throw an error if element is not found', async () => {
      // Set up mock to return null (element not found)
      findElementByText.mockReturnValueOnce(null);
      
      // Call the function and expect it to throw
      await expect(findAndClickElement('Non-existent')).rejects.toThrow(
        'Could not find element with text: Non-existent'
      );
      
      expect(findElementByText).toHaveBeenCalledWith('Non-existent');
    });
  });
  
  describe('findAndTypeInElement', () => {
    it('should find an input element and type text in it', async () => {
      // Mock input element (standard input)
      const mockInput = {
        tagName: 'INPUT',
        focus: jest.fn(),
        value: ''
      };
      
      // Set up mock to return the input
      findInputByText.mockReturnValueOnce(mockInput);
      
      // Call the function
      const result = await findAndTypeInElement('Email', 'test@example.com');
      
      // Verify the input was found and text was typed
      expect(findInputByText).toHaveBeenCalledWith('Email');
      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.value).toBe('test@example.com');
      expect(dispatchInputEvents).toHaveBeenCalledWith(mockInput);
      expect(result).toBe(true);
    });
    
    it('should handle textarea elements', async () => {
      // Mock textarea element
      const mockTextarea = {
        tagName: 'TEXTAREA',
        focus: jest.fn(),
        value: ''
      };
      
      // Set up mock to return the textarea
      findInputByText.mockReturnValueOnce(mockTextarea);
      
      // Call the function
      await findAndTypeInElement('Description', 'Test description');
      
      // Verify the textarea was handled correctly
      expect(mockTextarea.value).toBe('Test description');
    });
    
    it('should handle contentEditable elements', async () => {
      // Mock contentEditable element
      const mockEditable = {
        tagName: 'DIV',
        isContentEditable: true,
        focus: jest.fn(),
        textContent: ''
      };
      
      // Set up mock to return the contentEditable element
      findInputByText.mockReturnValueOnce(mockEditable);
      
      // Call the function
      await findAndTypeInElement('Editor', 'Test content');
      
      // Verify the contentEditable was handled correctly
      expect(mockEditable.textContent).toBe('Test content');
    });
    
    it('should throw an error if input is not found', async () => {
      // Set up mock to return null (input not found)
      findInputByText.mockReturnValueOnce(null);
      
      // Call the function and expect it to throw
      await expect(findAndTypeInElement('Non-existent', 'text')).rejects.toThrow(
        'Could not find input related to: Non-existent'
      );
      
      expect(findInputByText).toHaveBeenCalledWith('Non-existent');
    });
  });
});
