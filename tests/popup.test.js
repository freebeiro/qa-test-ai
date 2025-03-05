// Test file for the popup.js entry point
import { QAInterface as PopupQAInterface } from '../src/ui/popup.js';
import { QAInterface as IndexQAInterface } from '../src/ui/index.js';

// Mock index.js
jest.mock('../src/ui/index.js', () => ({
  QAInterface: jest.fn()
}));

describe('Popup Script', () => {
  it('should re-export the QAInterface from index.js', () => {
    // Verify that the popup.js QAInterface is the same as the index.js one
    expect(PopupQAInterface).toBe(IndexQAInterface);
  });
});