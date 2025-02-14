import NavigationCommand from './commands/navigation_command.js';
import SearchCommand from './commands/search_command.js';
import BackCommand from './commands/back_command.js';
import ForwardCommand from './commands/forward_command.js';
import RefreshCommand from './commands/refresh_command.js';
import ScrollCommand from './commands/scroll_command.js';
import FindCommand from './commands/find_command.js';
import FindAndClickCommand from './commands/find_and_click_command.js';
import SmartFindAndClickCommand from './commands/smart_find_and_click_command.js';

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
</file_content>

Try again with a more precise SEARCH block.
(If you keep running into this error, you may use the write_to_file tool as a workaround.)
</error><environment_details>
# VSCode Visible Files
command_factory.js

# VSCode Open Tabs
setup_ui_tars.sh
EXTENSION_FIXES.md
.env
README.md
ui-tars-requirements.txt
pdf-service-requirements.txt
docker-compose.yml
content.js
deepseek_interpreter.js
midscene/midscene.config.js
background.js
popup.html
command_processor.js
navigation_command.js
search_command.js
back_command.js
forward_command.js
refresh_command.js
scroll_command.js
find_command.js
find_and_click_command.js
smart_find_and_click_command.js
command.js
browser_tab_manager.js
ui_manager.js
command_parser.js
popup.js
tsconfig.json
commands/navigation_command.js
commands/search_command.js
commands/back_command.js
commands/forward_command.js
commands/refresh_command.js
commands/scroll_command.js
commands/find_command.js
commands/find_and_click_command.js
commands/smart_find_and_click_command.js
command_factory.js
.gitignore
templates/report_template.html
qa_report.pdf
manifest.json
config.js
../../../../Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
pdf_server.py

# Current Time
13/02/2025, 7:08:34 pm (Europe/Lisbon, UTC+0:00)

# Current Mode
ACT MODE
import NavigationCommand from './commands/navigation_command.js';
import SearchCommand from './commands/search_command.js';
import BackCommand from './commands/back_command.js';
import ForwardCommand from './commands/forward_command.js';
import RefreshCommand from './commands/refresh_command.js';
import ScrollCommand from './commands/scroll_command.js';
import FindCommand from './commands/find_command.js';
import FindAndClickCommand from './commands/find_and_click_command.js';
import SmartFindAndClickCommand from './commands/smart_find_and_click_command.js';

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
