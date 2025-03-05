// Test file for the popup.js entry point - outcome focused
import { QAInterface } from '../src/ui/popup.js';

// Mock the modules that popup.js imports
jest.mock('../src/ui/index.js', () => ({
  QAInterface: jest.fn()
}));

describe('Popup Script', () => {
  it('should export QAInterface', () => {
    expect(QAInterface).toBeDefined();
  });
});