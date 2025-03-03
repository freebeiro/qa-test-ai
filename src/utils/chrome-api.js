// Simple Chrome API wrapper for improved testability
// This wrapper uses the real Chrome API but can be mocked in tests
import { createNavigationHandler } from './chrome-navigation.js';

// Expose the Chrome API with a simpler interface
const chromeAPI = {
  tabs: {
    get: (tabId) => chrome.tabs.get(tabId),
    update: (tabId, updateProperties) => chrome.tabs.update(tabId, updateProperties),
    captureVisibleTab: (windowId, options) => chrome.tabs.captureVisibleTab(windowId, options),
    // Use createNavigationHandler for both back and forward navigation
    // First param is the native method, but we'll use executeScript inside the handler
    goBack: (tabId) => createNavigationHandler(chrome.tabs.goBack, tabId),
    goForward: (tabId) => createNavigationHandler(chrome.tabs.goForward, tabId),
    sendMessage: (tabId, message) => chrome.tabs.sendMessage(tabId, message),
    onUpdated: chrome.tabs.onUpdated
  },
  windows: {
    update: (windowId, updateInfo) => chrome.windows.update(windowId, updateInfo),
    create: (createData) => chrome.windows.create(createData)
  },
  runtime: {
    getURL: (path) => chrome.runtime.getURL(path),
    sendMessage: (message) => chrome.runtime.sendMessage(message),
    onMessage: chrome.runtime.onMessage
  },
  storage: {
    local: chrome.storage.local
  },
  scripting: {
    executeScript: (injection) => chrome.scripting.executeScript(injection)
  },
  action: {
    onClicked: chrome.action.onClicked
  }
};

export default chromeAPI;