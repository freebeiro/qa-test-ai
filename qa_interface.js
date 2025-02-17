export class QAInterface {
    constructor() {
        // Get DOM elements
        this.input = document.querySelector('#command-input');
        this.sendButton = document.querySelector('#send-button');
        this.screenshotDiv = document.querySelector('#screenshot');
        
        if (!this.input || !this.sendButton || !this.screenshotDiv) {
            console.error('❌ Required DOM elements not found');
            return;
        }

        this.setupEventListeners();
        console.log('🔧 QAInterface initialized');
    }

    setupEventListeners() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            console.log('🖱️ Send button clicked');
            const command = this.input.value.trim();
            if (command) {
                this.handleCommand(command);
            }
        });

        // Enter key press
        this.input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                const command = this.input.value.trim();
                if (command) {
                    this.handleCommand(command);
                }
            }
        });
    }

    handleCommand(command) {
        console.log(`🎯 Handling command: ${command}`);
        // For now, just echo the command
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `> ${command}`;
        this.screenshotDiv.appendChild(messageDiv);
        this.input.value = '';
    }
}