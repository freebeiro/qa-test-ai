# Troubleshooting Guide

## Service Management

### 1. Ollama Service Issues

#### Port Conflicts (Error: listen tcp 127.0.0.1:11434: bind: address already in use)

##### Diagnosis
```bash
# Check processes using port 11434
sudo lsof -i :11434
```

##### Resolution Steps
1. **Kill Existing Processes**
   ```bash
   # Kill specific process
   sudo kill -9 [PID]
   
   # Kill all Ollama processes
   pkill -9 ollama
   ```

2. **Clean Lock Files**
   ```bash
   sudo rm -f /tmp/ollama.lock
   ```

3. **Restart Service**
   ```bash
   ollama serve
   ```

#### Connection Issues (403 Forbidden)

##### CORS Configuration
```javascript
// Enhanced request headers
{
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Origin': 'chrome-extension://' + chrome.runtime.id
}
```

##### Manifest Settings
```json
{
    "host_permissions": [
        "http://localhost:11434/*",
        "https://localhost:11434/*",
        "<all_urls>"
    ],
    "content_security_policy": {
        "extension_pages": "script-src 'self'; object-src 'self'; connect-src http://localhost:11434 https://localhost:11434 https://* http://* ws://localhost:11434"
    }
}
```

## Error Handling

### 1. Enhanced Request Error Handling
```javascript
async function makeRequest(url, options) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error details:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                error: errorText,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Request failed (${response.status}): ${errorText}`);
        }

        return response;
    } catch (error) {
        console.error('Request failed:', {
            error: error.message,
            stack: error.stack,
            url: url,
            options: {
                ...options,
                body: options.body ? JSON.parse(options.body) : undefined
            },
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}
```

### 2. Service Health Monitoring
```javascript
async function checkOllamaStatus() {
    try {
        const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to connect to Ollama: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📡 Ollama status:', {
            running: true,
            models: data.models?.map(m => m.name) || [],
            timestamp: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('❌ Ollama status check failed:', {
            error: error.message,
            timestamp: new Date().toISOString()
        });
        return false;
    }
}
```

## Best Practices

### 1. Service Management
- Always check for existing processes before starting
- Implement proper cleanup procedures
- Monitor service health regularly
- Log service state changes

### 2. Error Recovery
- Implement retry mechanisms with exponential backoff
- Add detailed error logging
- Include context in error messages
- Monitor error patterns

### 3. Request Handling
- Use proper CORS headers
- Implement request timeouts
- Add request/response logging
- Handle streaming responses properly

## Development Guidelines

### 1. Local Development
1. Check service status before starting
2. Clear any zombie processes
3. Verify port availability
4. Monitor network requests

### 2. Testing
1. Test with clean service instance
2. Verify CORS configuration
3. Check error scenarios
4. Monitor resource usage

### 3. Deployment
1. Verify manifest permissions
2. Check content security policy
3. Test service connectivity
4. Validate error handling

## Future Improvements

### 1. Service Management
- Automatic service recovery
- Better process monitoring
- Enhanced cleanup procedures
- Health check endpoints

### 2. Error Handling
- Improved error classification
- Better recovery strategies
- Enhanced logging
- Error pattern analysis

### 3. Monitoring
- Real-time service monitoring
- Resource usage tracking
- Error rate monitoring
- Performance metrics

## UI Testing Issues

### ERR_BLOCKED_BY_CLIENT Error
When running UI tests, you might encounter the `ERR_BLOCKED_BY_CLIENT` error when trying to access the extension popup. This can happen due to:
- Brave's shields blocking access to extension pages
- Security settings preventing automation
- Extension not being properly loaded

Solutions:
1. Make sure the extension is enabled in Brave
2. Verify the extension ID matches in both the browser and test runner
3. Try running Brave with `--disable-web-security` flag
4. Use the existing browser session instead of launching a new one

### Browser Connection Issues
When trying to connect to Brave for testing, you might encounter timeout issues. Common problems include:
- Remote debugging port not being accessible
- WebSocket connection timing out
- Browser context not being available

Solutions:
1. Ensure Brave is running with `--remote-debugging-port=9222`
2. Verify the WebSocket URL is correct using `curl http://localhost:9222/json/version`
3. Check if the extension is properly loaded in the browser
4. Try increasing connection timeouts or disabling them

### Extension Popup Access
Issues accessing the extension popup can occur due to:
- Extension not being properly loaded
- Service worker being inactive
- Permission issues

Solutions:
1. Verify the extension is enabled and the service worker is active
2. Try accessing the popup through an existing browser context
3. Make sure all required permissions are granted
4. Check the extension ID matches between browser and test runner

## Current Debugging Session (2024-02-16)

### Issue: Extension Popup Access in UI Tests
We're currently debugging issues with accessing the extension popup during UI testing, specifically:
1. ERR_BLOCKED_BY_CLIENT errors when accessing extension
2. Browser connection timeouts
3. Empty page context when connecting to existing browser
4. Chat input element not being found

### Steps Taken
1. Modified browser connection approach:
   - Switched from launching new browser to connecting to existing session
   - Using CDP over WebSocket connection
   - Implemented longer timeouts and connection retries

2. Updated browser launch configuration:
   ```bash
   ./start-brave.sh
   # Added flags:
   # --remote-debugging-port=9222
   # --disable-web-security
   # --disable-features=IsolateOrigins,site-per-process
   # --disable-site-isolation-trials
   # --disable-extensions-http-throttling
   # --load-extension=./dist
   # --allow-file-access-from-files
   ```

3. Improved extension popup access:
   - Added wait for DOM content loaded
   - Implemented page context verification
   - Enhanced error logging and screenshots
   - Added multiple selector attempts for input element

4. Added debug server for better visibility:
   - Real-time log capture
   - Heartbeat monitoring
   - Extension state tracking
   - Page state debugging

### Current Status
- Successfully connecting to Brave browser ✅
- Successfully accessing extension page ✅
- Extension popup navigation working ✅
- Chat input element detection failing ❌

### Next Steps
1. Debug extension popup DOM structure
2. Verify input element is being rendered
3. Check for dynamic loading issues
4. Test with different input element selectors

### Latest Findings
1. Extension page is accessible but might not be fully loaded
2. Chat input is a textarea element, not an input
3. Multiple message selectors need to be tried
4. DOM structure verification is critical

### Current Investigation
1. Input Element:
   - Found that the chat input is a `textarea` element
   - Updated selectors to target textarea first
   - Added more detailed element property logging

2. Message List:
   - Added multiple selectors for message detection
   - Implemented DOM state logging on failure
   - Added screenshots for debugging

3. Extension State:
   - JavaScript is properly loaded
   - Chrome APIs are available
   - Document is in 'complete' state

### Next Steps
1. Verify textarea element is properly initialized
2. Check message list container structure
3. Add initialization checks for React/Vue components
4. Implement retry mechanism for failed commands

### Potential Solutions
1. Wait for textarea to be properly mounted:
   ```javascript
   await page.waitForFunction(() => {
       const textarea = document.querySelector('textarea');
       return textarea && textarea.isConnected;
   });
   ```

2. Check for dynamic content loading:
   ```javascript
   await page.waitForFunction(() => {
       return document.querySelector('.message-list') !== null;
   });
   ```

3. Verify extension state:
   ```javascript
   await page.evaluate(() => {
       return {
           hasTextarea: !!document.querySelector('textarea'),
           hasMessageList: !!document.querySelector('.message-list'),
           isReactMounted: !!document.querySelector('#app')?.__react
       };
   });
   ```

### Current Status
- Successfully connecting to Brave browser
- WebSocket debugging endpoint confirmed working
- Debug server running and ready to capture logs
- Ready to test extension popup access

### Next Steps
1. Verify extension ID and permissions
2. Test with different browser contexts
3. Add more detailed connection logging
4. Implement connection retry logic 

## Extension Window vs Popup Behavior

### Issue: Extension Opening in New Tab Instead of Window
When the extension opens in a new tab instead of a proper window, this is usually caused by conflicting configurations between the manifest and background script.

#### Common Causes
1. Having both `default_popup` in manifest.json and window creation in background.js
2. Incorrect URL handling in window creation
3. Missing proper window type configuration

#### Solution
1. **Remove `default_popup` from manifest.json**
   The manifest should only contain:
   ```json
   "action": {
     "default_title": "QA Testing Assistant",
     "default_icon": {
       "16": "icons/icon16.png",
       "48": "icons/icon48.png",
       "128": "icons/icon128.png"
     }
   }
   ```

2. **Use Proper Window Creation in background.js**
   ```javascript
   qaWindow = await chrome.windows.create({
     url: chrome.runtime.getURL('popup.html'),
     type: 'popup',
     width: 500,
     height: 700,
     top: 20,
     left: 20,
     focused: true
   });
   ```

3. **Key Points**
   - Use `chrome.runtime.getURL()` for extension URLs
   - Set `type: 'popup'` for proper window behavior
   - Specify dimensions and position for better UX
   - Handle window focus and cleanup properly 

## Cursor Implementation Details

### How the Cursor Works
The cursor (red dot) implementation uses several key techniques to ensure reliable visibility and smooth movement:

1. **Direct DOM Injection**
   ```javascript
   const cursor = document.createElement('div');
   cursor.id = 'qa-mouse-cursor';
   document.body.appendChild(cursor);
   ```

2. **Critical CSS Properties**
   ```css
   #qa-mouse-cursor {
       position: fixed !important;
       z-index: 2147483647 !important;
       pointer-events: none !important;
       transform: translate(-50%, -50%) !important;
       transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
   }
   ```

3. **Visibility Enforcement**
   - Using `!important` flags to prevent style overrides
   - Setting explicit `display: block` and `visibility: visible`
   - Using maximum z-index to stay on top
   - Implementing periodic visibility checks

4. **Movement Animation**
   - CSS transitions for smooth movement
   - RequestAnimationFrame for performance
   - Transform translate for accurate positioning
   - Cubic bezier timing for natural feel

### Common Cursor Issues

1. **Cursor Disappearing**
   - Cause: DOM updates or navigation
   - Solution: Periodic visibility check and recreation
   ```javascript
   setInterval(() => {
       const cursor = document.getElementById('qa-mouse-cursor');
       if (!cursor || !cursor.isConnected) {
           injectCursor(tabId);
       }
   }, 500);
   ```

2. **Z-Index Problems**
   - Cause: Other elements with high z-index
   - Solution: Using maximum safe z-index (2147483647)
   ```css
   z-index: 2147483647 !important;
   ```

3. **Movement Glitches**
   - Cause: CSS transition conflicts
   - Solution: Using transform and fixed positioning
   ```css
   position: fixed !important;
   transform: translate(-50%, -50%) !important;
   ```

4. **Style Overrides**
   - Cause: Page CSS affecting cursor
   - Solution: Using !important and specific selectors
   ```css
   #qa-mouse-cursor {
       /* All properties with !important */
       display: block !important;
       visibility: visible !important;
       opacity: 1 !important;
   }
   ```

### Best Practices

1. **Injection Timing**
   - Inject cursor after DOM is ready
   - Reinject on navigation completion
   - Check visibility periodically

2. **Style Management**
   - Use specific ID selectors
   - Apply !important to all properties
   - Set explicit values for all dimensions

3. **Performance**
   - Use RequestAnimationFrame for animations
   - Minimize DOM operations
   - Clean up on tab deactivation

4. **Error Recovery**
   - Implement visibility checks
   - Handle navigation events
   - Clean up old cursors before creating new ones