// Simple Chrome API wrapper for improved testability
// This wrapper uses the real Chrome API but can be mocked in tests

// Expose the Chrome API with a simpler interface
const chromeAPI = {
  tabs: {
    get: (tabId) => chrome.tabs.get(tabId),
    update: (tabId, updateProperties) => chrome.tabs.update(tabId, updateProperties),
    captureVisibleTab: (windowId, options) => chrome.tabs.captureVisibleTab(windowId, options),
    goBack: (tabId) => chrome.tabs.goBack(tabId),
    goForward: (tabId) => chrome.tabs.goForward(tabId),
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