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