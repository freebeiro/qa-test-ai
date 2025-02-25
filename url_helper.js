export class UrlHelper {
    static isInternalUrl(url) {
        if (!url) return true;
        
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol.toLowerCase();
            
            // List of internal protocols (without colons)
            const internalProtocols = [
                'chrome:',
                'chrome-extension:',
                'about:',
                'brave:',
                'edge:',
                'firefox:',
                'view-source:'
            ];
            
            // Log for debugging
            console.log(`Checking URL: ${url}, Protocol: ${protocol}, Is internal: ${internalProtocols.includes(protocol)}`);
            
            // Check if protocol is in the list of internal protocols
            const isInternal = internalProtocols.includes(protocol) || 
                   url === 'about:blank' || 
                   url === 'about:newtab';
                   
            return isInternal;
        } catch (e) {
            console.error('Invalid URL format:', e);
            return true; // Treat invalid URLs as internal for safety
        }
    }

    static isValidExternalUrl(url) {
        if (!url) return false;
        
        try {
            const urlObj = new URL(url);
            const protocol = urlObj.protocol.toLowerCase();
            
            // Allow only http and https protocols
            return protocol === 'http:' || protocol === 'https:';
        } catch (e) {
            console.error('Invalid URL format:', e);
            return false;
        }
    }

    static normalizeUrl(url) {
        if (!url) return '';
        
        try {
            // If URL doesn't start with a protocol, assume https
            if (!url.match(/^[a-zA-Z]+:\/\//)) {
                url = 'https://' + url;
            }
            
            const urlObj = new URL(url);
            return urlObj.toString();
        } catch (e) {
            console.error('URL normalization failed:', e);
            return url; // Return original URL if normalization fails
        }
    }
}