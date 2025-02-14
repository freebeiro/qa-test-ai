import NavigationCommand from '../commands/navigation_command.js';
import SearchCommand from '../commands/search_command.js';
import BackCommand from '../commands/back_command.js';
import ForwardCommand from '../commands/forward_command.js';
import RefreshCommand from '../commands/refresh_command.js';
import ScrollCommand from '../commands/scroll_command.js';
import FindCommand from '../commands/find_command.js';
import FindAndClickCommand from '../commands/find_and_click_command.js';
import SmartFindAndClickCommand from '../commands/smart_find_and_click_command.js';

class CommandFactory {
    static createCommand(type, params, browserTab) {
        switch (type) {
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
            case 'smartFind':
                return new SmartFindAndClickCommand(params.options, browserTab);
            default:
                return null;
        }
    }
}

export default CommandFactory;
