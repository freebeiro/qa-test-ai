// Element action functions
import { findElementByText, findInputByText } from './element-finder.js';
import { wait, dispatchInputEvents } from './content-utils.js';

// Find and click element intelligently
export async function findAndClickElement(text) {
  console.log('Finding element with text:', text);
  
  const element = findElementByText(text);
  
  if (!element) {
    throw new Error(`Could not find element with text: ${text}`);
  }
  
  // Scroll element into view and click
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await wait(300);
  element.click();
  return true;
}

// Find and type in targeted element
export async function findAndTypeInElement(targetText, textToType) {
  console.log('Finding input element described by:', targetText);
  
  const input = findInputByText(targetText);
  
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
  
  dispatchInputEvents(input);
  return true;
}