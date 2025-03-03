// Core content script functionality
import { findAndClickElement, findAndTypeInElement } from './element-actions.js';

// State tracking
let isControlledTab = false;

// Set up message listener
export function setupMessageListener() {
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

// Initialize content script
export function initialize() {
  console.log('QA Testing Assistant content script initialized');
  isControlledTab = true;
  
  setupMessageListener();
}

// Check if this is a controlled tab
export function isTabControlled() {
  return isControlledTab;
}

// Set controlled tab state
export function setTabControlled(state) {
  isControlledTab = state;
}