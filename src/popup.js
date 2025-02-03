import './styles/popup.css';
import { ReasonerService } from './services/ReasonerService';
import { config } from './config';

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('commandInput');
    const button = document.getElementById('sendButton');
    const chatHistory = document.getElementById('chatHistory');
    let port = null;
    
    function addMessage(text, isUser = false) {
        const message = document.createElement('div');
        message.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        message.textContent = text;
        chatHistory.appendChild(message);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    // Connect to background script
    function connectToBackground() {
        try {
            console.log('[INFO] Connecting to background...');
            port = chrome.runtime.connect({ name: "qa-window" });
            
            port.onMessage.addListener((message) => {
                console.log('[INFO] Received message:', message);
                if (message.type === 'INIT_STATE') {
                    console.log('[INFO] Got browserTabId:', message.browserTabId);
                }
                if (message.type === 'COMMAND_RESULT') {
                    addMessage(message.success ? '✅ ' + message.message : '❌ ' + message.error);
                }
            });

            // Request tab ID
            port.postMessage({ type: 'GET_TAB_ID' });
        } catch (error) {
            console.error('[ERROR] Connection failed:', error);
        }
    }

    async function handleCommand(command) {
        addMessage(command, true);
        addMessage("🤔 Processing your request...");

        port.postMessage({
            type: 'EXECUTE_COMMAND',
            command: command
        });
    }

    button.addEventListener('click', () => {
        const command = input.value.trim();
        if (command) {
            handleCommand(command);
            input.value = '';
        }
    });

    input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                handleCommand(command);
                input.value = '';
            }
        }
    });

    // Initialize connection
    connectToBackground();
    
    // Show initial message
    addMessage("👋 Hi! I'm your QA Testing Assistant. Try commands like 'go to example.com'");
});