// Element finder functionality
import { isElementVisible } from './content-utils.js';

// Find element by exact text match
export function findElementByExactText(elements, text) {
  return elements.find(el => {
    const content = el.textContent.trim();
    return content.toLowerCase() === text.toLowerCase();
  });
}

// Find element by partial text match
export function findElementByPartialText(elements, text) {
  return elements.find(el => {
    const content = el.textContent.trim();
    return content.toLowerCase().includes(text.toLowerCase());
  });
}

// Find element by attribute match
export function findElementByAttribute(elements, text) {
  return elements.find(el => {
    const title = el.getAttribute('title') || '';
    const ariaLabel = el.getAttribute('aria-label') || '';
    const alt = el.getAttribute('alt') || '';
    return title.toLowerCase().includes(text.toLowerCase()) ||
           ariaLabel.toLowerCase().includes(text.toLowerCase()) ||
           alt.toLowerCase().includes(text.toLowerCase());
  });
}

// Find nearest input element to a given element
export function findNearestInput(element) {
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

// Get all clickable elements on the page
export function getClickableElements() {
  return Array.from(document.querySelectorAll(
    'a, button, [role="button"], input[type="submit"], input[type="button"], ' +
    '[tabindex]:not([tabindex="-1"]), [onclick], [role="link"], [role="tab"], ' +
    'label, .btn, .button, .clickable'
  ));
}

// Find element by target text
export function findElementByText(text) {
  const elements = getClickableElements();
  
  // Try different matching strategies
  return findElementByExactText(elements, text) || 
         findElementByPartialText(elements, text) ||
         findElementByAttribute(elements, text);
}

// Find input element by associated text/label
export function findInputByText(targetText) {
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
  
  return input;
}