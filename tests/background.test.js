// Test file for the background.js main entry point - outcome focused
import { handleCommand } from '../src/background/background.js';

// Mock background-core.js which is imported by background.js
jest.mock('../src/background/background-core.js', () => ({
  handleCommand: jest.fn().mockResolvedValue({ success: true, screenshot: 'data:image/png;base64,test' })
}));

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should provide a handleCommand function', () => {
    expect(typeof handleCommand).toBe('function');
  });
  
  it('should pass commands to the core implementation', async () => {
    const mockCommand = { type: 'test' };
    
    // Get the mocked function
    const mockedCore = require('../src/background/background-core.js');
    
    // Call the exported handleCommand
    await handleCommand(mockCommand);
    
    // Verify it calls the background-core implementation
    expect(mockedCore.handleCommand).toHaveBeenCalledWith(mockCommand);
  });
});