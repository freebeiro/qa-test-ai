// Test file for content script utilities
import { isElementVisible, wait, dispatchInputEvents } from '../src/content/content-utils.js';

describe('Content Utilities', () => {
  describe('isElementVisible', () => {
    beforeEach(() => {
      // Set up test DOM
      document.body.innerHTML = `
        <div id="visible">Visible Element</div>
        <div id="hidden" style="display: none;">Hidden Element</div>
        <div id="invisible" style="visibility: hidden;">Invisible Element</div>
        <div id="transparent" style="opacity: 0;">Transparent Element</div>
        <div id="zero-width" style="width: 0;">Zero Width Element</div>
        <div id="zero-height" style="height: 0;">Zero Height Element</div>
      `;
      
      // Mock getBoundingClientRect
      Element.prototype.getBoundingClientRect = jest.fn().mockImplementation(function() {
        if (this.id === 'zero-width') {
          return { width: 0, height: 10 };
        } else if (this.id === 'zero-height') {
          return { width: 10, height: 0 };
        } else {
          return { width: 10, height: 10 };
        }
      });
    });
    
    afterEach(() => {
      document.body.innerHTML = '';
      jest.restoreAllMocks();
    });
    
    it('should return true for visible elements', () => {
      const element = document.getElementById('visible');
      expect(isElementVisible(element)).toBe(true);
    });
    
    it('should return false for elements with display: none', () => {
      const element = document.getElementById('hidden');
      expect(isElementVisible(element)).toBe(false);
    });
    
    it('should return false for elements with visibility: hidden', () => {
      const element = document.getElementById('invisible');
      expect(isElementVisible(element)).toBe(false);
    });
    
    it('should return false for elements with opacity: 0', () => {
      const element = document.getElementById('transparent');
      expect(isElementVisible(element)).toBe(false);
    });
    
    it('should return false for elements with zero width', () => {
      const element = document.getElementById('zero-width');
      expect(isElementVisible(element)).toBe(false);
    });
    
    it('should return false for elements with zero height', () => {
      const element = document.getElementById('zero-height');
      expect(isElementVisible(element)).toBe(false);
    });
    
    it('should return false for null or undefined elements', () => {
      expect(isElementVisible(null)).toBe(false);
      expect(isElementVisible(undefined)).toBe(false);
    });
  });
  
  describe('wait', () => {
    it('should wait for the specified time', async () => {
      jest.useFakeTimers();
      
      const promise = wait(1000);
      jest.advanceTimersByTime(1000);
      
      await promise; // Should resolve after the timer
      
      jest.useRealTimers();
    });
  });
  
  describe('dispatchInputEvents', () => {
    it('should dispatch input and change events', () => {
      // Create an input element
      const input = document.createElement('input');
      
      // Mock dispatchEvent
      input.dispatchEvent = jest.fn();
      
      // Call the function
      dispatchInputEvents(input);
      
      // Verify that dispatchEvent was called twice with the correct events
      expect(input.dispatchEvent).toHaveBeenCalledTimes(2);
      
      // Verify first call with input event
      const firstCall = input.dispatchEvent.mock.calls[0][0];
      expect(firstCall instanceof Event).toBe(true);
      expect(firstCall.type).toBe('input');
      expect(firstCall.bubbles).toBe(true);
      
      // Verify second call with change event
      const secondCall = input.dispatchEvent.mock.calls[1][0];
      expect(secondCall instanceof Event).toBe(true);
      expect(secondCall.type).toBe('change');
      expect(secondCall.bubbles).toBe(true);
    });
  });
});
