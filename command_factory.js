import { SmartClickCommand } from './smart_commands.js';
import { NavigationCommand, SearchCommand, BackCommand, ForwardCommand, 
         RefreshCommand, ScrollCommand, FindCommand, FindAndClickCommand } from './commands.js';
import { TestVisionCommand } from './vision_commands.js';

export class CommandFactory {
    static createCommand(type, params, browserTab) {
        console.log(`🏭 Creating command of type: ${type} with params:`, params);
        
        switch (type) {
            case 'click':
            case 'smartClick':
                return new SmartClickCommand(params.target, browserTab);
                
            case 'test_vision':
                return new TestVisionCommand(browserTab);
                
            case 'navigation':
                return new NavigationCommand(params.url, browserTab, params.skipFirstResult);
                
            case 'search':
                return new SearchCommand(params.query, browserTab);
                
            case 'back':
                return new BackCommand(browserTab);
                
            case 'forward':
                return new ForwardCommand(browserTab);
                
            case 'refresh':
                return new RefreshCommand(browserTab);
                
            case 'scroll':
                return new ScrollCommand(params.direction, browserTab);
                
            case 'find':
                return new FindCommand(params.text, browserTab);
                
            case 'findAndClick':
                return new FindAndClickCommand(params.text, browserTab);
                
            default:
                throw new Error(`Unknown command type: ${type}`);
        }
    }
}