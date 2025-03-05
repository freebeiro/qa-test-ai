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
  });
});