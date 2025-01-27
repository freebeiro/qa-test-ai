import config from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const button = document.getElementById('sendButton');
    const pdfButton = document.getElementById('generatePdfButton');

    let testSteps = [];

    // Function to add messages to our chat interface
    function addToChat(message, type = 'user') {
        console.log('Adding message to chat:', message);
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
        
        if (type === 'assistant' || type === 'user') {
            testSteps.push({
                action: message,
                screenshot: null
            });
        }
    }

    // Function to capture screenshots after actions
    async function captureAndShowScreenshot() {
        console.log('Attempting to capture screenshot...');
        try {
            // Wait briefly for page to settle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Capture the screenshot
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png',
                quality: 100
            });
            
            console.log('Screenshot captured successfully');

            // Create and add screenshot to chat
            const imgDiv = document.createElement('div');
            imgDiv.className = 'screenshot';
            const img = document.createElement('img');
            img.src = screenshot;
            img.style.maxWidth = '100%';
            img.style.border = '1px solid #ddd';
            img.style.borderRadius = '4px';
            img.style.marginTop = '10px';
            imgDiv.appendChild(img);
            chat.appendChild(imgDiv);
            chat.scrollTop = chat.scrollHeight;

            // Store screenshot in latest test step
            if (testSteps.length > 0) {
                testSteps[testSteps.length - 1].screenshot = screenshot.split(',')[1];
            }

            return true;
        } catch (error) {
            console.error('Screenshot failed:', error);
            addToChat('Could not capture screenshot: ' + error.message, 'error');
            return false;
        }
    }

    // Function to navigate to URLs
    async function navigateToUrl(url) {
        console.log('Attempting to navigate to:', url);
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            
            addToChat(`Navigating to ${url}...`, 'assistant');
            
            await chrome.tabs.update(tab.id, {url: fullUrl});
            
            // Wait for navigation and page load
            await new Promise(resolve => {
                chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                    if (tabId === tab.id && info.status === 'complete') {
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                });
            });

            // Capture screenshot after navigation
            const screenshotSuccess = await captureAndShowScreenshot();
            
            if (screenshotSuccess) {
                addToChat(`Successfully loaded ${url}`, 'assistant');
            }
        } catch (error) {
            console.error('Navigation failed:', error);
            addToChat(`Error during navigation: ${error.message}`, 'error');
        }
    }

    // Function to check if we're on a valid page
    async function checkCurrentTab() {
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        if (tab.url.startsWith('chrome://')) {
            addToChat('Please navigate to a regular webpage before using the extension. Chrome security prevents access to chrome:// pages.', 'error');
            return false;
        }
        return true;
    }

    // Main function to handle user commands
    async function handleCommand(userInput) {
        console.log('Processing command:', userInput);
        
        // Check if we're on a valid page first
        if (!await checkCurrentTab()) {
            return;
        }

        addToChat(userInput);

        try {
            // Extract navigation commands
            const goToMatch = userInput.toLowerCase().match(/^go to (.+)$/);
            if (goToMatch) {
                const url = goToMatch[1].trim();
                await navigateToUrl(url);
                return;
            }

            // For other commands, get the current page DOM
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const [{result: domContent}] = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => document.documentElement.outerHTML
            });

            // Get action plan from UI-TARS
            const actionPlan = await getUITarsResponse(userInput, domContent);
            console.log('Received action plan:', actionPlan);

            // Execute each action in the plan
            for (const action of actionPlan.actions) {
                addToChat(`Executing: ${action.description}`, 'assistant');
                // Implementation of action execution will go here
            }
        } catch (error) {
            console.error('Command processing error:', error);
            addToChat(`Error: ${error.message}`, 'error');
        }
    }

    // Event listeners for user interaction
    button.addEventListener('click', () => {
        console.log('Send button clicked');
        const userInput = input.value.trim();
        if (userInput) {
            input.value = '';
            handleCommand(userInput);
        }
    });

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.value.trim()) {
            e.preventDefault();
            const userInput = this.value.trim();
            this.value = '';
            handleCommand(userInput);
        }
    });

    // Initialize with welcome message
    addToChat('Ready! Please make sure you\'re on a regular webpage (not a chrome:// page) before using commands. Try "go to google.com" to start.', 'assistant');
    console.log('Extension initialized with UI-TARS and PDF capability');
});