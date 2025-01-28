import config from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize our UI elements
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const button = document.getElementById('sendButton');
    const pdfButton = document.getElementById('generatePdfButton');

    // Store test steps for our documentation
    let testSteps = [];

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

    async function captureAndShowScreenshot() {
        console.log('Attempting to capture screenshot...');
        try {
            // Wait for any animations or page changes to settle
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const screenshot = await chrome.tabs.captureVisibleTab(null, {
                format: 'png',
                quality: 100
            });
            
            console.log('Screenshot captured successfully');

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

    async function executeAction(action) {
        console.log('Executing action:', action);
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

        try {
            switch (action.type) {
                case 'navigation':
                    await handleNavigation(action, tab);
                    break;
                case 'search':
                    await handleSearch(action, tab);
                    break;
                default:
                    throw new Error(`Unsupported action type: ${action.type}`);
            }
        } catch (error) {
            console.error('Action execution failed:', error);
            addToChat(`Error: ${error.message}`, 'error');
        }
    }

    async function handleNavigation(action, tab) {
        // The key fix: keep popup open during navigation
        const url = action.parameters.url.startsWith('http') ? 
            action.parameters.url : `https://${action.parameters.url}`;
        
        addToChat(`Navigating to ${action.parameters.url}...`, 'assistant');
        
        // Execute navigation in the background
        await chrome.tabs.update(tab.id, {url});
        
        // Wait for navigation to complete
        await new Promise(resolve => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve();
                }
            });
        });

        await captureAndShowScreenshot();
        addToChat(`Successfully loaded ${action.parameters.url}`, 'assistant');
    }

    async function handleSearch(action, tab) {
        const { searchQuery } = action.parameters;
        addToChat(`Searching for "${searchQuery}"...`, 'assistant');

        try {
            // Get current page DOM content
            const [{result: domContent}] = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => document.documentElement.outerHTML
            });

            // Execute search using UI-TARS
            const searchResult = await executeUITarsCommand({
                type: 'search',
                query: searchQuery,
                dom: domContent
            });

            await captureAndShowScreenshot();
            addToChat(`Completed search for "${searchQuery}"`, 'assistant');
        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    async function handleCommand(userInput) {
        console.log('Processing command:', userInput);
        addToChat(userInput);

        try {
            // Extract navigation commands directly
            const navigationMatch = userInput.match(/^(?:go to|navigate to|open|visit)\s+([^\s]+)/i);
            if (navigationMatch) {
                await executeAction({
                    type: 'navigation',
                    parameters: {
                        url: navigationMatch[1]
                    }
                });
                return;
            }

            // Handle other commands through UI-TARS
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            const [{result: domContent}] = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => document.documentElement.outerHTML
            });

            const actionPlan = await getUITarsResponse(userInput, domContent);
            
            for (const action of actionPlan.actions) {
                await executeAction(action);
            }
        } catch (error) {
            console.error('Command processing error:', error);
            addToChat(`Error: ${error.message}`, 'error');
        }
    }

    // Event listeners for user interactions
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

    // Initialize
    addToChat('Ready! Try commands like "go to google.com" or "search for \'web testing\'"', 'assistant');
});