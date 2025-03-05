// Test file for the CommandProcessor class
import { CommandProcessor } from '../src/commands/command_processor.js';

describe('CommandProcessor', () => {
  let processor;

  beforeEach(() => {
    processor = new CommandProcessor();
  });

  describe('processCommand', () => {
    it('should trim input and pass to parseCommand', async () => {
      const spy = jest.spyOn(processor, 'parseCommand');
      await processor.processCommand('  test command  ');
      expect(spy).toHaveBeenCalledWith('test command');
    });
  });

  describe('parseCommand', () => {
    describe('navigation commands', () => {
      it('should handle "go to" navigation pattern', () => {
        const result = processor.parseCommand('go to example.com');
        expect(result).toEqual({ type: 'navigation', url: 'example.com' });
      });

      it('should handle "navigate to" navigation pattern', () => {
        const result = processor.parseCommand('navigate to example.com');
        expect(result).toEqual({ type: 'navigation', url: 'example.com' });
      });

      it('should handle "open" navigation pattern', () => {
        const result = processor.parseCommand('open example.com');
        expect(result).toEqual({ type: 'navigation', url: 'example.com' });
      });

      it('should handle "visit" navigation pattern', () => {
        const result = processor.parseCommand('visit example.com');
        expect(result).toEqual({ type: 'navigation', url: 'example.com' });
      });
    });

    describe('scrolling commands', () => {
      it('should handle "scroll down" with default amount', () => {
        const result = processor.parseCommand('scroll down');
        expect(result).toEqual({ type: 'scroll', direction: 'down', amount: 300 });
      });

      it('should handle "scroll up" with default amount', () => {
        const result = processor.parseCommand('scroll up');
        expect(result).toEqual({ type: 'scroll', direction: 'up', amount: -300 });
      });

      it('should handle "scroll down" with specific amount', () => {
        const result = processor.parseCommand('scroll down 500');
        expect(result).toEqual({ type: 'scroll', direction: 'down', amount: 500 });
      });

      it('should handle "scroll up" with specific amount', () => {
        const result = processor.parseCommand('scroll up 500');
        expect(result).toEqual({ type: 'scroll', direction: 'up', amount: -500 });
      });
    });

    describe('navigation history commands', () => {
      it('should handle "back" command', () => {
        const result = processor.parseCommand('back');
        expect(result).toEqual({ type: 'back' });
      });

      it('should handle "go back" command', () => {
        const result = processor.parseCommand('go back');
        expect(result).toEqual({ type: 'back' });
      });

      it('should handle "forward" command', () => {
        const result = processor.parseCommand('forward');
        expect(result).toEqual({ type: 'forward' });
      });

      it('should handle "go forward" command', () => {
        const result = processor.parseCommand('go forward');
        expect(result).toEqual({ type: 'forward' });
      });
    });

    describe('keyboard commands', () => {
      it('should handle "press enter" command', () => {
        const result = processor.parseCommand('press enter');
        expect(result).toEqual({ type: 'press_enter' });
      });
    });

    describe('typing commands', () => {
      it('should handle "type" into unspecified field', () => {
        const result = processor.parseCommand('type hello world');
        expect(result).toEqual({ type: 'input', text: 'hello world' });
      });

      it('should handle "type" with quotes', () => {
        const result = processor.parseCommand('type "hello world"');
        expect(result).toEqual({ type: 'input', text: 'hello world' });
      });

      it('should handle "type" with single quotes', () => {
        const result = processor.parseCommand("type 'hello world'");
        expect(result).toEqual({ type: 'input', text: 'hello world' });
      });

      it('should handle "type into" specific field', () => {
        const result = processor.parseCommand('type hello world in search field');
        expect(result).toEqual({ 
          type: 'input_targeted', 
          text: 'hello world', 
          target: 'search field' 
        });
      });

      it('should handle "type into" with quotes', () => {
        const result = processor.parseCommand('type "hello world" in "search field"');
        expect(result).toEqual({ 
          type: 'input_targeted', 
          text: 'hello world', 
          target: 'search field' 
        });
      });
    });

    describe('click commands', () => {
      it('should handle "click" command', () => {
        const result = processor.parseCommand('click submit button');
        expect(result).toEqual({ type: 'click', text: 'submit button' });
      });

      it('should return null for unrecognized commands', () => {
        const result = processor.parseCommand('some random text');
        expect(result).toBeNull();
      });
    });
  });
});