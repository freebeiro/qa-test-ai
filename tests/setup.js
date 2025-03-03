// Basic Jest setup for Chrome extension testing

// Mock Chrome APIs
global.chrome = {
  tabs: {
    get: jest.fn(),
    update: jest.fn(),
    captureVisibleTab: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn()
  },
  windows: {
    update: jest.fn(),
    create: jest.fn()
  },
  runtime: {
    getURL: jest.fn(),
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn()
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});