document.addEventListener('DOMContentLoaded', function() {
    // Initialize our UI elements
    const chat = document.getElementById('chat');
    const input = document.getElementById('input');
    const button = document.getElementById('sendButton');

    // This function adds messages to our chat interface and includes proper logging
    function addToChat(message, type = 'user') {
        console.log('Adding message to chat:', message);
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    // This function handles screenshot capture and display
    async function captureAndShowScreenshot() {
        console.log('Attempting to capture screenshot...');
        try {
            // Wait briefly for page to settle
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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

            return true;
        } catch (error) {
            console.error('Screenshot failed:', error);
            addToChat('Could not capture screenshot: ' + error.message, 'error');
            return false;
        }
    }

    // This function handles navigation with screenshot capture
    async function navigateToUrl(url) {
        console.log('Attempting to navigate to:', url);
        try {
            // First get the active tab
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            // Prepare the full URL
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            
            // Add status message
            addToChat(`Navigating to ${url}...`, 'assistant');
            
            // Perform the navigation
            await chrome.tabs.update(tab.id, {url: fullUrl});
            
            // Wait for page load
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Capture and show screenshot
            const screenshotSuccess = await captureAndShowScreenshot();
            
            // Add completion message
            if (screenshotSuccess) {
                addToChat(`Successfully loaded ${url}`, 'assistant');
            }
        } catch (error) {
            console.error('Navigation failed:', error);
            addToChat(`Error: ${error.message}`, 'error');
        }
    }

    // This function processes user commands
    async function handleCommand(userInput) {
        console.log('Processing command:', userInput);
        addToChat(userInput);

        // Parse and execute the command
        if (userInput.toLowerCase().includes('go to')) {
            const url = userInput.split('go to ')[1].trim();
            await navigateToUrl(url);
        } else {
            addToChat("I understand only 'go to' commands for now", 'assistant');
        }
    }

    // Set up event listeners for user interaction
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
            console.log('Enter key pressed');
            e.preventDefault();
            const userInput = this.value.trim();
            this.value = '';
            handleCommand(userInput);
        }
    });

    // Show initialization message
    addToChat('Ready! Try typing "go to google.com"', 'assistant');
    console.log('Extension initialized with screenshot capability');
});