const express = require('express');
const { WebSocketServer } = require('ws');
const { chromium } = require('playwright');
const cors = require('cors');

// Add logging utility
const log = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, err) => console.error(`[ERROR] ${msg}`, err),
  debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data ? JSON.stringify(data) : ''),
  warn: (msg, data) => console.warn(`[WARN] ${msg}`, data ? JSON.stringify(data) : '')
};

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Create HTTP server
const server = require('http').createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

let browserServer = null;
let browser = null;

// Initialize browser
async function initBrowser() {
    try {
        log.info('Initializing browser server...');
        browserServer = await chromium.launchServer({
            headless: true,
            args: ['--no-sandbox']
        });
        
        log.info('Connecting to browser server...', { wsEndpoint: browserServer.wsEndpoint() });
        // Connect to the browser
        browser = await chromium.connect({ wsEndpoint: browserServer.wsEndpoint() });
        log.info('Browser successfully initialized');
        return true;
    } catch (error) {
        log.error('Failed to initialize browser:', error);
        return false;
    }
}

// Handle WebSocket connections
wss.on('connection', async (ws) => {
    const clientId = Math.random().toString(36).substring(7);
    log.info('New client connected', { clientId });
    
    ws.send(JSON.stringify({
        type: 'success',
        data: { message: 'Connected to Playwright service', clientId }
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            log.info('Received command', { clientId, command: data.type, data: data.data });
            
            if (data.type === 'click') {
                try {
                    log.debug('Creating new browser context', { clientId });
                    const context = await browser.newContext();
                    const page = await context.newPage();
                    
                    // Set viewport size
                    log.debug('Setting viewport size', { clientId, width: 1280, height: 800 });
                    await page.setViewportSize({ width: 1280, height: 800 });
                    
                    // Navigate to URL
                    log.info('Navigating to URL', { clientId, url: data.data.url });
                    await page.goto(data.data.url);
                    await page.waitForLoadState('networkidle');
                    log.debug('Page loaded', { clientId });

                    // Enhanced element finding strategies
                    const searchText = data.data.text;
                    log.info('Searching for element', { clientId, searchText });
                    
                    const strategies = [
                        // Exact text match
                        `text="${searchText}"`,
                        // Case-insensitive text match
                        `text="${searchText}"i`,
                        // Button with text
                        `button:has-text("${searchText}")`,
                        // Link with text
                        `a:has-text("${searchText}")`,
                        // Element with role=button and text
                        `[role="button"]:has-text("${searchText}")`,
                        // Element with role=link and text
                        `[role="link"]:has-text("${searchText}")`,
                        // Any clickable element containing text
                        `a:has-text("${searchText}"), button:has-text("${searchText}"), [role="button"]:has-text("${searchText}"), [role="link"]:has-text("${searchText}")`,
                        // Partial text match as fallback
                        `:text-matches("${searchText}", "i")`
                    ];

                    let element = null;
                    for (const selector of strategies) {
                        try {
                            log.debug('Trying selector', { clientId, selector });
                            element = await page.waitForSelector(selector, { timeout: 2000 });
                            if (element) {
                                log.info('Found element', { clientId, selector });
                                break;
                            }
                        } catch (e) {
                            log.debug('Selector failed', { clientId, selector, error: e.message });
                            continue;
                        }
                    }

                    if (!element) {
                        throw new Error(`Could not find element with text: ${searchText}`);
                    }

                    // Ensure element is visible and clickable
                    await element.waitForElementState('visible');
                    await element.scrollIntoViewIfNeeded();
                    
                    // Take pre-click screenshot
                    const beforeScreenshot = await page.screenshot({
                        encoding: 'base64',
                        fullPage: false
                    });

                    // Click the element
                    await element.click();
                    log.info('Element clicked successfully', { clientId });

                    // Wait for any navigation or network activity
                    await Promise.race([
                        page.waitForLoadState('networkidle'),
                        new Promise(resolve => setTimeout(resolve, 2000))
                    ]);

                    // Take after-click screenshot
                    const afterScreenshot = await page.screenshot({
                        encoding: 'base64',
                        fullPage: false
                    });

                    ws.send(JSON.stringify({
                        type: 'success',
                        data: {
                            message: 'Click successful',
                            beforeScreenshot,
                            afterScreenshot
                        }
                    }));

                    await context.close();
                    log.debug('Browser context closed', { clientId });
                } catch (error) {
                    log.error('Click operation failed:', { clientId, error: error.message });
                    ws.send(JSON.stringify({
                        type: 'error',
                        data: { message: error.message }
                    }));
                }
            }
        } catch (error) {
            log.error('Error handling message:', { clientId, error: error.message });
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: error.message }
            }));
        }
    });
    
    ws.on('close', () => {
        log.info('Client disconnected', { clientId });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    log.debug('Health check requested');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket endpoint
app.get('/ws-endpoint', (req, res) => {
    if (browserServer) {
        log.debug('WebSocket endpoint requested', { wsEndpoint: browserServer.wsEndpoint() });
        res.json({ wsEndpoint: browserServer.wsEndpoint() });
    } else {
        log.warn('WebSocket endpoint requested but browser server not initialized');
        res.status(503).json({ error: 'Browser server not initialized' });
    }
});

// Start server
async function startServer() {
    if (await initBrowser()) {
        server.listen(port, () => {
            log.info('Server started', { port });
            log.info('WebSocket server ready', { wsEndpoint: `ws://localhost:${port}` });
        });
    } else {
        log.error('Server startup failed due to browser initialization failure');
        process.exit(1);
    }
}

// Cleanup on exit
process.on('SIGINT', async () => {
    log.info('Shutting down server...');
    if (browser) {
        log.debug('Closing browser...');
        await browser.close();
    }
    if (browserServer) {
        log.debug('Closing browser server...');
        await browserServer.close();
    }
    log.info('Cleanup complete');
    process.exit(0);
});

// Start the server
startServer();