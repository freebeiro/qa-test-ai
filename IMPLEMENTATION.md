# QA Testing Assistant Implementation

## Core Components

### Vision Integration
```javascript
export class VisionService {
    constructor() {
        this.ollamaEndpoint = 'http://localhost:11434/api/generate';
        this.model = 'llama3.2-vision';
    }
}
```

### Command System
```javascript
class CommandProcessor {
    parseCommand(input) {
        const commands = [
            {
                type: 'test_vision',
                pattern: /^test\s+vision$/i,
                handler: () => ({ type: 'test_vision' })
            }
        ];
    }
}
```

### UI Components
```
+------------------------+
|     Chat History      |
|  +------------------+ |
|  | Command Message  | |
|  +------------------+ |
|  | Screenshot      | |
|  +------------------+ |
+------------------------+
|  Command Input        |
|  Send Button          |
+------------------------+
```

## Commands

### Navigation
```
go to <url>
navigate to <url>
open <url>
```

### Browser Control
```
back
forward
refresh
```

### Search
```
search for <term>
google <term>
```

### Element Interaction
```
click <text>
find <text>
enter <text>
```

### Vision Analysis
```
test vision
```

## Error Handling

### Vision Service
- Screenshot capture errors
- API connection issues
- Model response parsing
- Element detection failures

### Command Processing
- Unknown commands
- Invalid parameters
- Failed operations
- Navigation errors

## State Management
```javascript
let browserTabId = null;
let qaWindow = null;
let activePort = null;
```

## Message Passing
```javascript
chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "qa-window") {
        // Handle messages
    }
});
```

## Recent Updates

1. Command System Improvements
   - Added missing commands (back, forward, scroll, refresh)
   - Enhanced command processing with better error handling
   - Integrated vision capabilities with commands

2. Screenshot Integration
   - Automatic screenshot capture after each command
   - Screenshot capture on page load completion
   - Visual feedback in chat history

3. Vision Features
   - Ollama vision model integration
   - Element detection and analysis
   - Smart click suggestions

## Next Steps

1. Testing
   - Add unit tests for new commands
   - Integration tests for screenshot system
   - Error scenario handling

2. UI Improvements
   - Loading states during command execution
   - Better error display
   - Enhanced visual feedback

3. Vision Enhancements
   - Improve element detection accuracy
   - Add more intelligent action suggestions
   - Enhanced layout analysis

# Implementation Details

## UI Testing Framework

The UI testing framework is built using Playwright and consists of several key components:

### Test Runner (`ui_test_runner.js`)
- Manages browser connection and test execution
- Handles extension popup automation
- Executes test scenarios
- Captures and reports errors

### Debug Server (`debug_server.js`)
- Captures extension logs in real-time
- Provides HTTP endpoints for log access
- Supports heartbeat monitoring
- Maintains a rolling log buffer

### Browser Management
- Connects to existing Brave browser session
- Handles remote debugging protocol
- Manages browser contexts and pages
- Automates extension popup interactions

### Test Scenarios
Test scenarios are defined as sequences of commands that exercise different aspects of the extension:
```javascript
const scenarios = [
    {
        name: 'Basic Navigation',
        commands: [
            'go to google.com',
            'search cats',
            'back',
            'forward'
        ]
    },
    // ... more scenarios ...
];
```

### Extension Integration
The test runner integrates with the extension through:
- Direct access to extension pages
- Automation of popup interactions
- Monitoring of extension logs
- Verification of extension state

### Browser Launch Scripts
Several scripts are provided to manage browser instances:
- `start-brave.sh`: Launches Brave with debugging enabled
- `launch-brave.sh`: Launches Brave with additional security flags
- `start-chrome.sh`: Legacy Chrome launch script for comparison

## Extension Window Management

### Window Creation Strategy
The extension uses a dedicated window management approach instead of the default popup behavior. This provides better control over the window dimensions, positioning, and user experience.

#### Implementation Details
1. **Manifest Configuration**
   - Removed `default_popup` to prevent automatic popup behavior
   - Retained icon and title configurations
   - Ensures proper permissions for window management

2. **Background Script Window Management**
   ```javascript
   // State tracking
   let qaWindow = null;

   chrome.action.onClicked.addListener(async (tab) => {
     try {
       // Reuse existing window if available
       if (qaWindow) {
         try {
           await chrome.windows.update(qaWindow.id, { focused: true });
           return;
         } catch (error) {
           cleanup();
         }
       }
       
       // Create new window
       qaWindow = await chrome.windows.create({
         url: chrome.runtime.getURL('popup.html'),
         type: 'popup',
         width: 500,
         height: 700,
         top: 20,
         left: 20,
         focused: true
       });
     } catch (error) {
       console.error('Failed to create window:', error);
       cleanup();
     }
   });
   ```

3. **Window Lifecycle Management**
   - Tracks window state using `qaWindow` variable
   - Implements cleanup on window close
   - Handles window focus and reuse
   - Maintains proper state in storage

This implementation ensures:
- Consistent window behavior across sessions
- Better user experience with proper window dimensions
- Efficient window reuse and state management
- Clean handling of window lifecycle events
