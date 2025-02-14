# QA Testing Assistant Extension Architecture

[Previous content remains the same until the commands section]

### 8. `commands/` Directory Updates

Important changes have been made to how commands interact with the browser:

*   **Browser Interaction:**
    * Commands now use `chrome.scripting.executeScript` instead of deprecated `chrome.tabs` methods
    * This allows for more reliable interaction with the active tab
    * Navigation commands (back, forward) now use window.history API
    * Commands include proper waiting periods for navigation and animations

*   **Screenshots:**
    * Commands are responsible for their own screenshot timing
    * Screenshots are captured after waiting for navigation/animation completion
    * This ensures screenshots accurately reflect the page state

[Rest of the content remains the same]