// Test file for the content.js main entry point
import '../src/content/content.js';
import { initialize } from '../src/content/content-core.js';

// Mock content-core.js
jest.mock('../src/content/content-core.js', () => ({
  initialize: jest.fn()
}));

describe('Content Script', () => {
  it('should initialize the content script', () => {
    // Verify initialize was called when content.js was imported
    expect(initialize).toHaveBeenCalled();
  });
});