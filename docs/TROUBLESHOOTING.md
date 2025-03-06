# Troubleshooting Guide

## Common Issues

### Extension Not Loading

If the extension is not loading in Chrome:

1. Check that the extension is built correctly by running `npm run build`
2. Verify that the `dist/` folder contains all necessary files
3. Make sure you're loading the extension from the correct folder in Chrome's extension page
4. Check for errors in the Chrome extension page (chrome://extensions)
5. Look for errors in the background script console (click "background page" in the extension details)

### Commands Not Working

If commands are not working:

1. Check the console for errors
2. Verify that the command is being sent to the background script
3. Check that the command is being parsed correctly
4. Ensure that the appropriate handler is being called
5. Verify that the content script is receiving the command

### Navigation Issues

If navigation commands (go to, back, forward) are not working:

1. Check that the URL is being formatted correctly
2. Verify that the navigation history is being tracked
3. Ensure that the tab ID is being passed correctly 
4. Look for errors in the console related to navigation

#### Tab ID Type Conversion Issue

A common issue is that the tab ID may not be properly converted to a number, causing navigation failures with messages like:

```
Attempting to navigate back for tab null
```

This happens because the Chrome storage API sometimes converts numeric values to strings. When the tab ID is retrieved from storage but not explicitly converted back to a number, it can cause type mismatches when passed to Chrome APIs.

**Solution:**

1. When retrieving the tab ID from storage, explicitly parse it as an integer:

```javascript
// Correct approach
browserTabId = parseInt(data.browserTabId);

// Incorrect approach
browserTabId = data.browserTabId; // May be a string!
```

2. When setting the tab ID, ensure it's a number:

```javascript
// Correct approach
browserTabId = tab?.id ? parseInt(tab.id) : null;

// Incorrect approach
browserTabId = tab?.id; // May not be coerced correctly
```

3. In navigation handlers, add robust type checking:

```javascript
// Correct approach
const tabId = typeof browserTabId === 'number' ? browserTabId : 
             (browserTabId && !isNaN(parseInt(browserTabId)) ? parseInt(browserTabId) : null);

// Incorrect approach
const tabId = browserTabId; // May not be a number
```

By ensuring consistent type handling, you can prevent navigation failures related to tab ID type mismatches.

### Clicking and Typing Issues

If clicking or typing commands are not working:

1. Check that the element is being found correctly
2. Verify that the content script is injected in the page
3. Ensure that the element is visible and clickable
4. Look for errors in the console related to element interaction

## Debugging Tips

### Background Script Debugging

To debug the background script:

1. Go to chrome://extensions
2. Find the QA Testing Assistant extension
3. Click "background page" to open the DevTools for the background script
4. Use the console to view logs and errors

### Content Script Debugging

To debug the content script:

1. Open DevTools in the page where the content script is running
2. Go to the Console tab
3. Look for logs and errors from the content script

### Popup Debugging

To debug the popup:

1. Right-click on the extension icon and select "Inspect popup"
2. Use the DevTools to view logs and errors

## Common Error Messages

### "Cannot access a chrome:// URL"

Chrome extensions cannot access chrome:// URLs. Make sure you're not trying to navigate to or interact with a chrome:// URL.

### "Cannot find module"

If you see this error during build:

1. Make sure all dependencies are installed by running `npm install`
2. Check that the import path is correct
3. Verify that the module exists

### "window is not defined"

This error occurs when trying to access the `window` object in a context where it doesn't exist (like a background script):

1. Check if you're trying to access `window` in a background script
2. Use alternative methods for storing data, like Chrome storage or module-level variables

### "No navigation history available"

This error occurs when trying to navigate back or forward without any history:

1. Make sure you've navigated to at least one page before trying to go back
2. Check that navigation history is being tracked correctly
3. Verify that the tab ID is being passed correctly

#### Debugging Tab ID Issues

If you see errors like "Attempting to navigate back for tab null" or "Cannot find a next page in history," follow these steps:

1. **Check the console logs** to see if the tab ID is properly tracked:
   ```
   Navigation history for tab [tabId]: [history array]
   Current position for tab [tabId]: [position]
   ```

2. **Verify tab ID type consistency** by adding logging:
   ```javascript
   console.log('Tab ID type:', typeof browserTabId, browserTabId);
   ```

3. **Test the fix** by implementing the type conversion solutions described in the "Tab ID Type Conversion Issue" section above

4. If you've implemented custom history tracking, ensure it's properly tracking navigation state by checking:
   ```javascript
   console.log(navigationHistoryMap[tabId]);
   console.log(currentPositionMap[tabId]);
   ```

## Handling CAPTCHA and Human Verification

The QA Testing Assistant now includes enhanced support for interacting with CAPTCHA and human verification elements. When encountering websites with CAPTCHA verification:

### Dedicated CAPTCHA Command

For the most reliable CAPTCHA interaction, use the dedicated CAPTCHA command:

```
captcha
```

This command will:
1. Try multiple approaches to find and interact with CAPTCHA elements
2. Use specialized selectors for different CAPTCHA implementations
3. Apply appropriate interaction methods based on the type of CAPTCHA found
4. Fall back to alternative methods if the primary approach fails
5. Try coordinate-based clicks at common CAPTCHA positions

You can also use these alternative commands which do the same thing:
```
verify
verify_human
```

### Coordinate-Based Clicking

If the CAPTCHA is still not being detected properly, you can try clicking directly at specific coordinates on the page:

```
click_at x=500 y=400
```

This command will:
1. Find the element at the specified coordinates
2. Dispatch click events directly to that element
3. Handle special cases like checkboxes automatically

You can also use these alternative command formats:
```
click_coordinates x=500 y=400
click_position x=500 y=400
```

For Cloudflare CAPTCHA specifically, try clicking in the center-bottom area of the page:
```
click_at x=500 y=600
```

### Using the Click Command with CAPTCHAs

You can also use the standard click command with specific text:

```
click verify you are human
click checkbox
click cloudflare-checkbox
```

When using these commands, the extension will:

1. Attempt to find the CAPTCHA element using specialized selectors
2. Apply appropriate interaction methods based on the type of CAPTCHA:
   - For checkbox-based CAPTCHAs: Check the box and dispatch appropriate events
   - For iframe-based CAPTCHAs: Focus the iframe and attempt to interact with it
   - For standard elements: Use enhanced click methods with fallbacks

### Limitations

- Some advanced CAPTCHA implementations may still require manual intervention
- The extension cannot solve CAPTCHA puzzles that require image recognition or other complex tasks
- Websites with sophisticated bot detection may still block automated interactions

### Troubleshooting CAPTCHA Issues

If the extension fails to interact with a CAPTCHA:

1. Try the dedicated `captcha` command first
2. If that fails, try coordinate-based clicking with `click_at x=500 y=400` (adjust coordinates as needed)
3. If that fails, try more specific commands like `click checkbox` or `click cloudflare-checkbox`
4. Check the console logs for detailed information about the CAPTCHA detection process
5. For websites with complex verification systems, manual intervention may be required 