// Test file for the background.js main entry point
import { handleCommand } from '../src/background/background.js';
import * as backgroundCore from '../src/background/background-core.js';

// Mock background-core.js
jest.mock('../src/background/background-core.js', () => ({
  handleCommand: jest.fn()
}));

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should re-export the handleCommand function from background-core', () => {
    // Set up mock for testing
    const mockCommand = { type: 'test' };
    backgroundCore.handleCommand.mockResolvedValueOnce({ success: true });
    
    // Call re-exported function
    handleCommand(mockCommand);
    
    // Verify it calls the background-core version
    expect(backgroundCore.handleCommand).toHaveBeenCalledWith(mockCommand);
  });
});