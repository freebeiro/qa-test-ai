/**
 * Test script for QA Testing Assistant commands
 */
class TestRunner {
    constructor() {
        this.delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        this.results = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Wait for DOM content loaded
        document.addEventListener('DOMContentLoaded', () => {
            const runButton = document.getElementById('run-tests');
            if (runButton) {
                runButton.addEventListener('click', () => this.runTests());
            }
        });
    }

    log(message, type = 'info') {
        const logMessage = `[Test] ${message}`;
        console.log(logMessage);
        this.results.push({ message: logMessage, type });
        
        // Add to chat history
        const qa = window.qaInterface;
        if (qa?.ui) {
            qa.ui.addMessage({
                command: message,
                timestamp: new Date().toISOString(),
                type: 'test'
            });
        }
    }

    async runTests() {
        try {
            this.log('Starting test sequence...');
            
            // Test sequence: Navigation
            await this.testCommand('go to google.pt', 2000);
            await this.testCommand('click "Google Search"', 1000);
            await this.testCommand('go to worten.pt', 3000);
            
            // Find and click tests
            await this.testCommand('find "Menu"', 1000);
            await this.testCommand('click "Menu"', 1000);
            
            // Scroll tests
            await this.testCommand('scroll down', 1000);
            await this.testCommand('scroll up', 1000);
            await this.testCommand('scroll bottom', 1000);
            await this.testCommand('scroll top', 1000);

            // Navigation history tests
            await this.testCommand('back', 2000);
            await this.testCommand('forward', 2000);

            this.log('Tests completed!');
            this.showResults();

        } catch (error) {
            console.error('Test failed:', error);
            this.log(`❌ Test failed: ${error.message}`, 'error');
        }
    }

    async testCommand(command, waitTime = 1000) {
        this.log(`Testing command: "${command}"`, 'test');
        
        // Get reference to QA interface
        const qa = window.qaInterface;
        if (!qa) {
            throw new Error('QA Interface not found');
        }

        try {
            // Get input element
            const input = document.getElementById('command-input');
            const sendButton = document.getElementById('send-button');
            
            if (!input || !sendButton) {
                throw new Error('UI elements not found');
            }

            // Enter command
            input.value = command;
            
            // Send command
            sendButton.click();
            
            // Wait for specified time
            await this.delay(waitTime);
            
            this.log(`✅ Command "${command}" executed`, 'success');
        } catch (error) {
            this.log(`❌ Command "${command}" failed: ${error.message}`, 'error');
            throw error;
        }
    }

    showResults() {
        console.log('\n=== Test Results ===');
        this.results.forEach(({message, type}) => {
            const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
            console.log(`${icon} ${message}`);
        });
    }
}

// Initialize test runner
window.qaTestRunner = new TestRunner();