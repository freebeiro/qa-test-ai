class UIManager {
    constructor(elements) {
        this.elements = elements;
        this.isProcessing = false;
        this.init();
    }

    init() {
        if (this.elements.chat) {
            this.elements.chat.classList.add('chat-history');
        }
    }

    getInputValue() {
        return this.elements.input?.value.trim() || '';
    }

    clearInput() {
        if (this.elements.input) {
            this.elements.input.value = '';
            this.elements.input.focus();
        }
    }

    setProcessing(isProcessing) {
        this.isProcessing = isProcessing;
        this.updateControlsState();
    }

    updateControlsState() {
        if (!this.elements) return;

        const { input, sendButton } = this.elements;
        const enabled = !this.isProcessing;
        
        if (input) {
            input.disabled = !enabled;
            input.style.opacity = enabled ? '1' : '0.7';
        }

        if (sendButton) {
            sendButton.disabled = !enabled;
            sendButton.style.backgroundColor = enabled ? '#61afef' : '#444';
            sendButton.style.cursor = enabled ? 'pointer' : 'not-allowed';
            sendButton.textContent = enabled ? 'Send' : 'Processing...';
        }
    }

    addMessage(entry) {
        if (!this.elements.chat) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-entry';
        
        this.appendCommandText(messageDiv, entry.command);
        
        if (entry.error) {
            this.appendError(messageDiv, entry.error);
        }
        
        if (entry.screenshots?.length > 0) {
            this.appendScreenshots(messageDiv, entry.screenshots);
        }
        
        this.appendTimestamp(messageDiv, entry.timestamp);
        
        this.elements.chat.appendChild(messageDiv);
        this.scrollToBottom();
    }

    appendCommandText(container, command) {
        const div = document.createElement('div');
        div.className = 'command-text';
        div.textContent = `> ${command}`;
        container.appendChild(div);
    }

    appendError(container, error) {
        const div = document.createElement('div');
        div.className = 'error-message';
        div.textContent = error;
        container.appendChild(div);
    }

    appendScreenshots(container, screenshots) {
        const screenshotsDiv = document.createElement('div');
        screenshotsDiv.className = 'screenshots-container';
        
        screenshots.forEach((screenshot, idx) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'screenshot-wrapper';
            
            const img = document.createElement('img');
            img.src = screenshot.data;
            img.alt = `Screenshot ${idx + 1}`;
            img.loading = 'lazy';
            
            const caption = document.createElement('div');
            caption.className = 'screenshot-caption';
            caption.textContent = screenshot.caption || `Step ${idx + 1}`;
            
            wrapper.appendChild(img);
            wrapper.appendChild(caption);
            screenshotsDiv.appendChild(wrapper);
        });
        
        container.appendChild(screenshotsDiv);
    }

    appendTimestamp(container, timestamp) {
        const div = document.createElement('div');
        div.className = 'timestamp';
        div.textContent = new Date(timestamp).toLocaleTimeString();
        container.appendChild(div);
    }

    scrollToBottom() {
        if (this.elements.chat) {
            this.elements.chat.scrollTop = this.elements.chat.scrollHeight;
        }
    }
}

export default UIManager;