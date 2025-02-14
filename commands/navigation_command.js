import Command from '../core/command.js';

class NavigationCommand extends Command {
    constructor(url, browserTab, skipFirstResult = false) {
        super();
        this.url = url;
        this.browserTab = browserTab;
        this.skipFirstResult = skipFirstResult;
        console.log(`🌐 Creating NavigationCommand for: ${this.url} (skipFirstResult: ${skipFirstResult})`);
    }

    async execute() {
        try {
            const formattedUrl = this.formatUrl(this.url);
            console.log(`🌐 Formatted URL: ${formattedUrl}`);

            if (formattedUrl && !this.skipFirstResult) {
                console.log(`🌐 Attempting direct navigation to: ${formattedUrl}`);
                try {
                    await this.browserTab.navigate(formattedUrl);
                } catch (navigationError) {
                    console.error('❌ Navigation error:', navigationError);
                    console.error('❌ Navigation error message:', navigationError.message);
                    throw new Error(`Navigation failed: ${navigationError.message}`);
                }

                // Wait for page load
                await new Promise(resolve => setTimeout(resolve, 2000));

                try {
                    // Check if page loaded successfully
                    const checkPageScript = () => {
                        const errorTexts = [
                            "This site can't be reached",
                            "DNS_PROBE_POSSIBLE",
                            "ERR_NAME_NOT_RESOLVED",
                            "ERR_CONNECTION_REFUSED",
                            "showing error page"
                        ];
                        
                        const pageText = document.body.innerText;
                        return errorTexts.some(error => pageText.includes(error));
                    };

                    const hasError = await this.browserTab.executeScript(checkPageScript);
                    
                    // If script execution failed or error detected, fall back to Google search
                    if (hasError?.[0] || !hasError) {
                        console.log('🔄 Page error detected, falling back to Google search');
                        return await this.handleGoogleSearch();
                    }

                    // Take screenshot of successful navigation
                    await this.browserTab.captureScreenshot();
                    return true;

                } catch (scriptError) {
                    console.log('🔄 Script execution failed, falling back to Google search');
                    return await this.handleGoogleSearch();
                }
            }

            // If no direct URL, do Google search
            return await this.handleGoogleSearch();

        } catch (error) {
            console.error('❌ Navigation error:', error);
            throw error;
        }
    }

    async handleGoogleSearch() {
        console.log(`🔍 Searching Google for: ${this.url}`);
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(this.url)}`;
        await this.browserTab.navigate(googleUrl);
        
        // Wait for Google results and take screenshot
        await new Promise(resolve => setTimeout(resolve, 1500));
        await this.browserTab.captureScreenshot();
        
        if (!this.skipFirstResult) {
            // Click first result
            const clickFirstResult = () => {
                const searchResults = document.querySelectorAll('#search .g a');
                if (searchResults.length > 0) {
                    const firstResult = searchResults[0];
                    console.log('🎯 Clicking first result:', firstResult.href);
                    firstResult.click();
                    return firstResult.href;
                }
                return false;
            };

            const result = await this.browserTab.executeScript(clickFirstResult);
            if (!result?.[0]) {
                throw new Error('Could not find search results');
            }

            // Wait for destination page and take screenshot
            await new Promise(resolve => setTimeout(resolve, 2000));
            await this.browserTab.captureScreenshot();
        }

        return true;
    }

    formatUrl(url) {
        // If it's already a full URL, return it
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }

        // If it contains a dot, treat it as a domain
        if (url.includes('.')) {
            return `https://${url.startsWith('www.') ? '' : 'www.'}${url}`;
        }

        // Otherwise, return null to indicate we should search
        return null;
    }
}

export default NavigationCommand;
