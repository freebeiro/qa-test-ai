import config from './config.js';
import CommandProcessor from './command_processor.js';

document.addEventListener('DOMContentLoaded', async function() {
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const button = document.getElementById('sendButton');
    
    // Initialize our command processor with configuration
    const commandProcessor = new CommandProcessor(config);
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
            // Wait for any page changes to settle
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
        const url = action.parameters.url.startsWith('http') ? 
            action.parameters.url : `https://${action.parameters.url}`;
        
        addToChat(`Navigating to ${action.parameters.url}...`, 'assistant');
        
        // Start navigation and wait for it to complete
        await chrome.tabs.update(tab.id, {url});
        
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
            // Get the page DOM for UI-TARS to analyze
            const [{result: domContent}] = await chrome.scripting.executeScript({
                target: {tabId: tab.id},
                function: () => document.documentElement.outerHTML
            });

            // Let UI-TARS analyze the page and create an interaction plan
            const analysis = await commandProcessor.uiTars.analyze('search', domContent, {
                type: 'search',
                parameters: { searchQuery }
            });

            // Execute the interaction plan
            const result = await commandProcessor.uiTars.executePlan(analysis, {
                tabId: tab.id,
                value: searchQuery
            });

            // Capture the result
            await captureAndShowScreenshot();
            
            if (result.success) {
                addToChat(`Successfully searched for "${searchQuery}"`, 'assistant');
            } else {
                throw new Error('Search execution failed');
            }
        } catch (error) {
            console.error('Search operation failed:', error);
            addToChat(`Failed to execute search: ${error.message}`, 'error');
        }
    }

    async function handleCommand(userInput) {
        console.log('Processing command:', userInput);
        addToChat(userInput);

        try {
            // Process the command through our intelligent system
            const { actions } = await commandProcessor.processCommand(userInput);
            
            // Execute each action in sequence
            for (const action of actions) {
                await executeAction(action);
            }
        } catch (error) {
            console.error('Command processing error:', error);
            addToChat(`Error: ${error.message}`, 'error');
        }
    }

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

    // Initialize with a helpful message
    addToChat('Ready! I can help with navigation and search on any website. Try commands like "go to google.com" or "search for \'test\'"', 'assistant');
});