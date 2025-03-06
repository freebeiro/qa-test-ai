// Test file for element finder functionality
import { 
  findElementByExactText,
  findElementByPartialText,
  findElementByAttribute,
  findNearestInput,
  getClickableElements,
  findElementByText,
  findInputByText
} from '../src/content/element-finder.js';

// Mock content-utils
jest.mock('../src/content/content-utils.js', () => ({
  isElementVisible: jest.fn().mockReturnValue(true)
}));

describe('Element Finder', () => {
  // Helper function to create test elements
  function createTestElements() {
    return [
      { textContent: 'Submit', getAttribute: () => null },
      { textContent: 'Cancel', getAttribute: () => null },
      { textContent: 'Search', getAttribute: () => 'search-button' },
      { 
        textContent: 'Help', 
        getAttribute: (attr) => {
          if (attr === 'title') return 'Help button';
          if (attr === 'aria-label') return 'Get assistance';
          return null;
        }
      }
    ];
  }
  
  // Helper to create a test DOM structure
  function createTestDom() {
    document.body.innerHTML = `
      <div id="container">
        <label for="name-input">Name</label>
        <input id="name-input" type="text">
        
        <div>
          <span>Email</span>
          <input type="email" placeholder="Enter your email">
        </div>
        
        <button>Submit</button>
        <a href="#">Help</a>
      </div>
    `;
  }
  
  describe('findElementByExactText', () => {
    it('should find element with exact text match (case insensitive)', () => {
      const elements = createTestElements();
      
      expect(findElementByExactText(elements, 'Submit')).toBe(elements[0]);
      expect(findElementByExactText(elements, 'submit')).toBe(elements[0]);
      expect(findElementByExactText(elements, 'Cancel')).toBe(elements[1]);
    });
    
    it('should return undefined if no exact match is found', () => {
      const elements = createTestElements();
      
      expect(findElementByExactText(elements, 'NotFound')).toBeUndefined();
    });
  });
  
  describe('findElementByPartialText', () => {
    it('should find element with partial text match', () => {
      const elements = createTestElements();
      
      expect(findElementByPartialText(elements, 'Sub')).toBe(elements[0]);
      expect(findElementByPartialText(elements, 'anc')).toBe(elements[1]);
    });
    
    it('should return undefined if no partial match is found', () => {
      const elements = createTestElements();
      
      expect(findElementByPartialText(elements, 'xyz')).toBeUndefined();
    });
  });
  
  describe('findElementByAttribute', () => {
    it('should find element by title attribute', () => {
      const elements = createTestElements();
      
      expect(findElementByAttribute(elements, 'help button')).toBe(elements[3]);
    });
    
    it('should find element by aria-label attribute', () => {
      const elements = createTestElements();
      
      expect(findElementByAttribute(elements, 'assistance')).toBe(elements[3]);
    });
    
    it('should return undefined if no attribute match is found', () => {
      const elements = createTestElements();
      
      expect(findElementByAttribute(elements, 'not-found')).toBeUndefined();
    });
  });
  
  describe('findInputByText', () => {
    beforeEach(() => {
      createTestDom();
      
      // Mock document.querySelectorAll for different selectors
      const querySelectorAllOriginal = document.querySelectorAll;
      jest.spyOn(document, 'querySelectorAll').mockImplementation((selector) => {
        return querySelectorAllOriginal.call(document, selector);
      });
      
      jest.spyOn(document, 'getElementById').mockImplementation((id) => {
        return document.querySelector(`#${id}`);
      });
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
      document.body.innerHTML = '';
    });

    it('should find email input specifically when searching for email', () => {
      const input = findInputByText('email');
      expect(input.getAttribute('type')).toBe('email');
    });

    it('should find email input by name attribute', () => {
      document.body.innerHTML = `
        <input type="email" name="user_email">
      `;
      const input = findInputByText('email');
      expect(input.getAttribute('type')).toBe('email');
    });

    it('should find email input by aria-label', () => {
      document.body.innerHTML = `
        <input type="email" aria-label="Email address input">
      `;
      const input = findInputByText('email');
      expect(input.getAttribute('type')).toBe('email');
    });

    it('should fallback to regular input when no email input is found', () => {
      document.body.innerHTML = `
        <input type="text" placeholder="Enter email here">
      `;
      const input = findInputByText('email');
      expect(input.getAttribute('type')).toBe('text');
    });
    
    it('should find input by associated label', () => {
      const input = findInputByText('Name');
      
      expect(input).toBe(document.getElementById('name-input'));
    });
    
    it('should find input by nearby text', () => {
      const input = findInputByText('Email');
      
      expect(input.getAttribute('type')).toBe('email');
    });
    
    it('should find input by placeholder', () => {
      const input = findInputByText('Enter your email');
      
      expect(input.getAttribute('type')).toBe('email');
    });
    
    it('should return undefined for text with no associated input', () => {
      const input = findInputByText('NonExistent');
      
      expect(input).toBeUndefined();
    });
  });
  
  describe('findNearestInput', () => {
    beforeEach(() => {
      createTestDom();
    });
    
    afterEach(() => {
      document.body.innerHTML = '';
    });
    
    it('should find nearest input to an element', () => {
      const element = document.querySelector('span');
      const input = findNearestInput(element);
      
      expect(input.getAttribute('type')).toBe('email');
    });

    it('should find email input when targetText is email', () => {
      const element = document.querySelector('span');
      const input = findNearestInput(element, 'email');
      
      expect(input.getAttribute('type')).toBe('email');
    });

    it('should find any visible input when no specific inputs are found', () => {
      // Create a test DOM with no inputs in the parent but some elsewhere
      document.body.innerHTML = `
        <div id="container">
          <span id="test-span">Some text</span>
        </div>
        <input type="text" id="distant-input">
      `;
      
      const contentUtils = require('../src/content/content-utils.js');
      contentUtils.isElementVisible.mockReturnValue(true);
      
      const element = document.getElementById('test-span');
      const input = findNearestInput(element);
      
      expect(input).toBe(document.getElementById('distant-input'));
    });
  });

  describe('getClickableElements', () => {
    it('should return all clickable elements', () => {
      createTestDom();
      
      const querySelectorAllSpy = jest.spyOn(document, 'querySelectorAll');
      
      getClickableElements();
      
      expect(querySelectorAllSpy).toHaveBeenCalledWith(
        expect.stringContaining('a, button')
      );
      
      querySelectorAllSpy.mockRestore();
      document.body.innerHTML = '';
    });
  });
  
  describe('findElementByText', () => {
    it('should find element by text using various strategies', () => {
      // Create a test DOM with elements we can find
      document.body.innerHTML = `
        <button id="submit-btn">Submit</button>
        <a href="#" id="help-link" title="help-button">Help</a>
      `;
      
      // Test finding by exact text
      const submitButton = document.getElementById('submit-btn');
      const helpLink = document.getElementById('help-link');
      
      // We need to mock getClickableElements to return our actual DOM elements
      jest.spyOn(require('../src/content/element-finder.js'), 'getClickableElements')
          .mockReturnValue([submitButton, helpLink]);
      
      // Test finding by exact text match
      const foundByText = findElementByText('Submit');
      expect(foundByText).toBe(submitButton);
      
      // Test finding by attribute
      const foundByAttribute = findElementByText('help-button');
      expect(foundByAttribute).toBe(helpLink);
      
      jest.restoreAllMocks();
      document.body.innerHTML = ''
    });
  });
});