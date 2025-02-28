// State tracking
let isControlledTab = false;

// Initialize content script
function initialize() {
  console.log('QA Testing Assistant content script initialized');
  isControlledTab = true;
  
  // Set up message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.type);
    
    // Handle click command
    if (request.type === 'CLICK') {
      findAndClickElement(request.text)
        .then(result => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    
    // Handle targeted typing
    if (request.type === 'TYPE_TARGETED') {
      findAndTypeInElement(request.target, request.text)
        .then(result => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    
    // Always respond to ping
    if (request.type === 'PING') {
      sendResponse({ success: true });
      return true;
    }
  });
}

// Find and click element intelligently
async function findAndClickElement(text) {
  console.log('Finding element with text:', text);
  
  // Enhanced selector for better element detection
  const elements = Array.from(document.querySelectorAll(
    'a, button, [role="button"], input[type="submit"], input[type="button"], ' +
    '[tabindex]:not([tabindex="-1"]), [onclick], [role="link"], [role="tab"], ' +
    'label, .btn, .button, .clickable'
  ));
  
  // Try different matching strategies
  let element = findElementByExactText(elements, text) || 
                findElementByPartialText(elements, text) ||
                findElementByAttribute(elements, text);
  
  if (!element) {
    throw new Error(`Could not find element with text: ${text}`);
  }
  
  // Scroll element into view and click
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await new Promise(resolve => setTimeout(resolve, 300));
  element.click();
  return true;
}

// Find and type in targeted element
async function findAndTypeInElement(targetText, textToType) {
  console.log('Finding input element described by:', targetText);
  
  // Find labels or near-text elements
  const labels = Array.from(document.querySelectorAll('label'));
  const labelMatch = labels.find(label => 
    label.textContent.toLowerCase().includes(targetText.toLowerCase())
  );
  
  let input;
  if (labelMatch && labelMatch.htmlFor) {
    input = document.getElementById(labelMatch.htmlFor);
  } else {
    // Try to find inputs near text matching the target
    const allText = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
    const nearText = allText.find(el => 
      el.textContent.toLowerCase().includes(targetText.toLowerCase())
    );
    
    if (nearText) {
      // Look for inputs near this text
      input = findNearestInput(nearText);
    }
  }
  
  // Fallback to any input with matching placeholder or name
  if (!input) {
    input = Array.from(document.querySelectorAll('input, textarea'))
      .find(input => {
        const placeholder = input.getAttribute('placeholder') || '';
        const name = input.getAttribute('name') || '';
        const ariaLabel = input.getAttribute('aria-label') || '';
        return placeholder.toLowerCase().includes(targetText.toLowerCase()) ||
               name.toLowerCase().includes(targetText.toLowerCase()) ||
               ariaLabel.toLowerCase().includes(targetText.toLowerCase());
      });
  }
  
  if (!input) {
    throw new Error(`Could not find input related to: ${targetText}`);
  }
  
  // Type in the input
  input.focus();
  if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
    input.value = textToType;
  } else if (input.isContentEditable) {
    input.textContent = textToType;
  }
  
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

// Helper functions
function findElementByExactText(elements, text) {
  return elements.find(el => {
    const content = el.textContent.trim();
    return content.toLowerCase() === text.toLowerCase();
  });
}

function findElementByPartialText(elements, text) {
  return elements.find(el => {
    const content = el.textContent.trim();
    return content.toLowerCase().includes(text.toLowerCase());
  });
}

function findElementByAttribute(elements, text) {
  return elements.find(el => {
    const title = el.getAttribute('title') || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const alt = el.getAttribute('alt') || '';
    return title.toLowerCase().includes(text.toLowerCase()) ||
           ariaLabel.toLowerCase().includes(text.toLowerCase()) ||
           alt.toLowerCase().includes(text.toLowerCase());
  });
}

function findNearestInput(element) {
  // Look for inputs that are siblings or children
  const parent = element.parentElement;
  if (parent) {
    const siblingInput = Array.from(parent.querySelectorAll('input, textarea'))
      .find(input => isElementVisible(input));
    if (siblingInput) return siblingInput;
  }
  
  // Look in a wider radius
  const inputs = Array.from(document.querySelectorAll('input, textarea'))
    .filter(input => isElementVisible(input));
  
  // Find closest by DOM position
  return inputs[0]; // Simplified, could be enhanced with actual distance calculation
}

function isElementVisible(element) {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  return true;
}

// Initialize the content script
initialize();
