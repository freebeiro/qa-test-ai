// Test file for the content.js main entry point - outcome focused
// Note: This file only imports and runs initialize()

// Mock content-core.js to verify it gets called
jest.mock('../src/content/content-core.js', () => ({
  initialize: jest.fn()
}));

describe('Content Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should call initialize when imported', () => {
    // Import the content script which should call initialize
    require('../src/content/content.js');
    
    // Check if initialize was called
    const contentCore = require('../src/content/content-core.js');
    expect(contentCore.initialize).toHaveBeenCalled();
  });
});