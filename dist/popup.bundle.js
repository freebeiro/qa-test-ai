/******/ (() => { // webpackBootstrap
/******/ 	"use strict";

;// ./vision_service.js
class VisionService {
  constructor() {
    this.ollamaEndpoint = 'http://localhost:11434/api/generate';
    this.model = 'llama3.2-vision';
  }
  async analyzeScreenshot(screenshotBase64) {
    try {
      // Remove data URL prefix if present and ensure proper base64 encoding
      const base64Data = screenshotBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          prompt: "Analyze this webpage screenshot. Identify and describe: 1) Clickable elements 2) Input fields 3) Navigation elements 4) Main content areas 5) Layout structure. Focus on interactive elements and their locations.",
          images: [base64Data]
        })
      });
      if (!response.ok) {
        throw new Error(`Vision API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return this.parseVisionResponse(data);
    } catch (error) {
      console.error('Vision analysis failed:', error);
      throw error;
    }
  }
  parseVisionResponse(response) {
    // Process the vision model's response to extract useful information
    const analysis = {
      elements: this.extractElements(response),
      text: response.response,
      // Changed from response.text to response.response
      suggestions: this.generateInteractionSuggestions(response)
    };
    console.log('Vision Analysis:', analysis);
    return analysis;
  }
  extractElements(response) {
    // Extract information about UI elements from the vision response
    const elements = [];
    try {
      const text = response.response;

      // Extract clickable elements
      const buttonMatches = text.match(/button[^\.]*\./gi) || [];
      const linkMatches = text.match(/link[^\.]*\./gi) || [];

      // Extract input fields
      const inputMatches = text.match(/input[^\.]*\./gi) || [];
      const formMatches = text.match(/form[^\.]*\./gi) || [];
      elements.push(...buttonMatches.map(match => ({
        type: 'button',
        description: match
      })), ...linkMatches.map(match => ({
        type: 'link',
        description: match
      })), ...inputMatches.map(match => ({
        type: 'input',
        description: match
      })), ...formMatches.map(match => ({
        type: 'form',
        description: match
      })));
    } catch (error) {
      console.error('Error extracting elements:', error);
    }
    return elements;
  }
  generateInteractionSuggestions(response) {
    const suggestions = [];
    try {
      const text = response.response;

      // Look for actionable elements
      if (text.includes('button')) suggestions.push('Try clicking the identified buttons');
      if (text.includes('input')) suggestions.push('You can fill out the input fields');
      if (text.includes('form')) suggestions.push('Complete and submit the form');
      if (text.includes('link')) suggestions.push('Navigate using the available links');
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
    return suggestions;
  }
  async findElementByIntent(screenshotBase64, intent) {
    try {
      // Ask the vision model to specifically look for elements matching our intent
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          stream: false,
          prompt: `Find the best element matching this user intention: "${intent}"
                            Consider:
                            1. Element text and purpose
                            2. Visual appearance and location
                            3. Common patterns for this type of element
                            4. Context and surrounding elements
                            
                            Describe the best matching element in detail, including:
                            1. Exact location (top, bottom, left, right, center)
                            2. Visual characteristics
                            3. Confidence level (0-100)
                            4. Why this is the best match
                            
                            Format response as JSON with these fields:
                            {"location", "description", "confidence", "reasoning"}
                            `,
          images: [screenshotBase64]
        })
      });
      if (!response.ok) {
        throw new Error(`Vision API request failed: ${response.statusText}`);
      }
      const data = await response.json();
      return this.parseElementMatch(data);
    } catch (error) {
      console.error('Element finding failed:', error);
      throw error;
    }
  }
  parseElementMatch(response) {
    try {
      // Extract the JSON object from the model's text response
      const jsonMatch = response.response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const elementInfo = JSON.parse(jsonMatch[0]);
        return {
          location: this.parseLocation(elementInfo.location),
          description: elementInfo.description,
          confidence: parseInt(elementInfo.confidence) / 100,
          reasoning: elementInfo.reasoning
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to parse element match:', error);
      return null;
    }
  }
  parseLocation(locationText) {
    // Convert textual location to more precise coordinates
    const coords = {
      x: 0.5,
      // Default to center
      y: 0.5
    };

    // More granular coordinate adjustments
    if (locationText.includes('top')) {
      coords.y = locationText.includes('very top') ? 0.1 : 0.25;
    }
    if (locationText.includes('bottom')) {
      coords.y = locationText.includes('very bottom') ? 0.9 : 0.75;
    }
    if (locationText.includes('left')) {
      coords.x = locationText.includes('far left') ? 0.1 : 0.25;
    }
    if (locationText.includes('right')) {
      coords.x = locationText.includes('far right') ? 0.9 : 0.75;
    }
    if (locationText.includes('center')) {
      coords.x = 0.5;
      coords.y = 0.5;
    }
    return coords;
  }

  // Helper method to ensure page is fully loaded
  async waitForPageLoad() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }
}
;// ./commands.js
// Import the vision service for vision-enhanced commands


// Base Command class for all commands
class Command {
  execute() {
    throw new Error('Command must implement execute method');
  }
}

// Navigation Command for handling URL navigation
class NavigationCommand extends Command {
  constructor(url, browserTab, skipFirstResult = false) {
    super();
    this.url = url;
    this.browserTab = browserTab;
    this.skipFirstResult = skipFirstResult;
    console.log(`🌐 Creating NavigationCommand for: ${this.url}`);
  }
  async execute() {
    // Navigation implementation remains the same
    try {
      await this.browserTab.navigate(this.url);
      return true;
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  }
}

// Search Command for handling search operations
class SearchCommand extends Command {
  constructor(query, browserTab) {
    super();
    this.query = query;
    this.browserTab = browserTab;
    console.log(`🔍 Creating SearchCommand for: "${query}"`);
  }
  async execute() {
    try {
      // Search implementation
      const searchScript = query => {
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
          searchInput.value = query;
          searchInput.dispatchEvent(new Event('input'));
          return true;
        }
        return false;
      };
      return await this.browserTab.executeScript(searchScript, [this.query]);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}

// Back Command for browser history navigation
class BackCommand extends Command {
  constructor(browserTab) {
    super();
    this.browserTab = browserTab;
    console.log('⬅️ Creating BackCommand');
  }
  async execute() {
    try {
      await this.browserTab.executeScript(() => window.history.back());
      return true;
    } catch (error) {
      console.error('Back navigation failed:', error);
      throw error;
    }
  }
}

// Forward Command for browser history navigation
class ForwardCommand extends Command {
  constructor(browserTab) {
    super();
    this.browserTab = browserTab;
    console.log('➡️ Creating ForwardCommand');
  }
  async execute() {
    try {
      await this.browserTab.executeScript(() => window.history.forward());
      return true;
    } catch (error) {
      console.error('Forward navigation failed:', error);
      throw error;
    }
  }
}

// Refresh Command for page reloading
class RefreshCommand extends Command {
  constructor(browserTab) {
    super();
    this.browserTab = browserTab;
    console.log('🔄 Creating RefreshCommand');
  }
  async execute() {
    try {
      await this.browserTab.executeScript(() => window.location.reload());
      return true;
    } catch (error) {
      console.error('Refresh failed:', error);
      throw error;
    }
  }
}

// Scroll Command for page scrolling
class ScrollCommand extends Command {
  constructor(direction, browserTab) {
    super();
    this.direction = direction;
    this.browserTab = browserTab;
    console.log(`🔄 Creating ScrollCommand: ${direction}`);
  }
  async execute() {
    try {
      const scrollScript = direction => {
        switch (direction) {
          case 'up':
            window.scrollBy(0, -300);
            break;
          case 'down':
            window.scrollBy(0, 300);
            break;
          case 'top':
            window.scrollTo(0, 0);
            break;
          case 'bottom':
            window.scrollTo(0, document.body.scrollHeight);
            break;
        }
        return true;
      };
      return await this.browserTab.executeScript(scrollScript, [this.direction]);
    } catch (error) {
      console.error('Scroll failed:', error);
      throw error;
    }
  }
}

// Find Command for text finding
class FindCommand extends Command {
  constructor(text, browserTab) {
    super();
    this.text = text;
    this.browserTab = browserTab;
    console.log(`🔍 Creating FindCommand for: "${text}"`);
  }
  async execute() {
    try {
      const findScript = searchText => {
        return window.find(searchText);
      };
      return await this.browserTab.executeScript(findScript, [this.text]);
    } catch (error) {
      console.error('Find failed:', error);
      throw error;
    }
  }
}

// FindAndClick Command for finding and clicking elements
class FindAndClickCommand extends Command {
  constructor(text, browserTab) {
    super();
    this.text = text;
    this.browserTab = browserTab;
    console.log(`🎯 Creating FindAndClickCommand for: "${text}"`);
  }
  async execute() {
    try {
      const findAndClickScript = searchText => {
        const elements = document.querySelectorAll('*');
        for (const element of elements) {
          var _element$textContent;
          if ((_element$textContent = element.textContent) !== null && _element$textContent !== void 0 && _element$textContent.includes(searchText)) {
            element.click();
            return true;
          }
        }
        return false;
      };
      return await this.browserTab.executeScript(findAndClickScript, [this.text]);
    } catch (error) {
      console.error('FindAndClick failed:', error);
      throw error;
    }
  }
}

// End of command classes
;// ./vision_commands.js



// Base class for vision-enhanced commands
class VisionEnhancedCommand extends Command {
  constructor(browserTab) {
    super();
    this.browserTab = browserTab;
    this.visionService = new VisionService();
  }
}

// Command for testing vision capabilities
class TestVisionCommand extends VisionEnhancedCommand {
  constructor(browserTab) {
    super(browserTab);
    console.log('🔍 Creating TestVisionCommand');
  }
  async execute() {
    try {
      console.log('📸 Capturing screenshot for vision test...');
      const screenshot = await this.browserTab.captureScreenshot();
      const base64Image = screenshot.replace(/^data:image\/\w+;base64,/, '');
      console.log('🔍 Running vision analysis...');
      const analysis = await this.visionService.analyzeScreenshot(base64Image);
      console.log('📊 Vision analysis results:', analysis);
      return {
        success: true,
        message: 'Vision analysis completed',
        screenshots: [{
          data: screenshot,
          caption: 'Analyzed Page'
        }],
        analysis: this.formatResults(analysis)
      };
    } catch (error) {
      console.error('❌ Vision test failed:', error);
      throw error;
    }
  }
  formatResults(analysis) {
    var _analysis$elements, _analysis$suggestions;
    let formatted = 'Vision Analysis Results:\n\n';
    if (((_analysis$elements = analysis.elements) === null || _analysis$elements === void 0 ? void 0 : _analysis$elements.length) > 0) {
      formatted += '📍 Interactive Elements Found:\n';
      analysis.elements.forEach(el => {
        formatted += `• ${el.type}: ${el.description}\n`;
      });
      formatted += '\n';
    }
    if (((_analysis$suggestions = analysis.suggestions) === null || _analysis$suggestions === void 0 ? void 0 : _analysis$suggestions.length) > 0) {
      formatted += '💡 Suggested Actions:\n';
      analysis.suggestions.forEach(suggestion => {
        formatted += `• ${suggestion}\n`;
      });
      formatted += '\n';
    }
    if (analysis.text) {
      formatted += '📝 Detailed Analysis:\n';
      formatted += analysis.text;
    }
    return formatted;
  }
}

// Command for locating elements using vision and text analysis
class LocateCommand extends VisionEnhancedCommand {
  constructor(browserTab, params) {
    super(browserTab);
    this.text = params.text;
    this.section = params.section;
    this.itemIndex = params.itemIndex;
    console.log('🔍 Creating LocateCommand:', params);
  }
  async execute() {
    try {
      console.log('🔍 Locating element...');

      // First try direct DOM search
      const elementFound = await this.browserTab.executeScript(data => {
        return new Promise(resolve => {
          chrome.runtime.sendMessage({
            type: 'LOCATE_ELEMENT',
            data
          }, resolve);
        });
      }, [{
        text: this.text,
        section: this.section,
        itemIndex: this.itemIndex
      }]);
      if (elementFound.success) {
        console.log('✅ Element found through DOM:', elementFound.element);

        // Capture screenshot with highlight
        const screenshot = await this.browserTab.captureScreenshot();

        // Hide highlight after screenshot
        await this.browserTab.executeScript(() => {
          return new Promise(resolve => {
            chrome.runtime.sendMessage({
              type: 'HIDE_HIGHLIGHT'
            }, resolve);
          });
        });
        return {
          success: true,
          message: 'Element located successfully',
          element: elementFound.element,
          screenshots: [{
            data: screenshot,
            caption: `Located element: ${elementFound.element.text}`
          }]
        };
      }

      // If DOM search fails, try vision-based search
      console.log('🔍 Trying vision-based search...');
      const screenshot = await this.browserTab.captureScreenshot();
      const base64Image = screenshot.replace(/^data:image\/\w+;base64,/, '');
      let prompt = '';
      if (this.section && this.itemIndex) {
        prompt = `Find the ${this.itemIndex}th item in the "${this.section}" section`;
      } else if (this.section) {
        prompt = `Find the section labeled "${this.section}"`;
      } else {
        prompt = `Find the element with text "${this.text}"`;
      }
      const elementInfo = await this.visionService.findElementByIntent(base64Image, prompt);
      if (elementInfo && elementInfo.confidence > 0.7) {
        console.log('✅ Element found through vision:', elementInfo);

        // Try to highlight the element using coordinates
        await this.browserTab.executeScript(coords => {
          const element = document.elementFromPoint(coords.x * window.innerWidth, coords.y * window.innerHeight);
          if (element) {
            return new Promise(resolve => {
              chrome.runtime.sendMessage({
                type: 'LOCATE_ELEMENT',
                data: {
                  element
                }
              }, resolve);
            });
          }
        }, [elementInfo.location]);

        // Capture screenshot with highlight
        const highlightedScreenshot = await this.browserTab.captureScreenshot();

        // Hide highlight
        await this.browserTab.executeScript(() => {
          return new Promise(resolve => {
            chrome.runtime.sendMessage({
              type: 'HIDE_HIGHLIGHT'
            }, resolve);
          });
        });
        return {
          success: true,
          message: 'Element located through vision analysis',
          element: elementInfo,
          screenshots: [{
            data: highlightedScreenshot,
            caption: `Located element: ${elementInfo.description}`
          }]
        };
      }
      throw new Error('Element not found');
    } catch (error) {
      console.error('❌ Element location failed:', error);
      throw error;
    }
  }
}
;// ./command_processor.js

class CommandProcessor {
  constructor(browserTab) {
    this.browserTab = browserTab;
    console.log('🔧 Initializing CommandProcessor');
  }
  async processCommand(input) {
    const command = input.trim();
    console.log('Processing command:', command);
    try {
      // First try to parse as a standard command
      const commandObj = this.parseCommand(command);
      if (commandObj) {
        console.log('Command parsed as:', commandObj);
        return commandObj;
      }

      // Then try to parse as a locate command
      const findMatch = command.match(/^find\s+(.+)$/i);
      if (findMatch) {
        const query = findMatch[1];

        // Match "find Nth item in Section"
        const itemInSectionMatch = query.match(/(\d+)(?:st|nd|rd|th)?\s+item\s+in\s+(.+)/i);
        if (itemInSectionMatch) {
          return new LocateCommand(this.browserTab, {
            section: itemInSectionMatch[2],
            itemIndex: parseInt(itemInSectionMatch[1])
          });
        }

        // Match "find tab/button/link Text"
        const elementTypeMatch = query.match(/^(tab|button|link)\s+(.+)/i);
        if (elementTypeMatch) {
          return new LocateCommand(this.browserTab, {
            text: elementTypeMatch[2],
            type: elementTypeMatch[1]
          });
        }

        // Default to simple text search
        return new LocateCommand(this.browserTab, {
          text: query
        });
      }
      throw new Error('Unknown command');
    } catch (error) {
      console.error('Command processing failed:', error);
      throw new Error(`Command processing failed: ${error.message}`);
    }
  }
  parseCommand(input) {
    console.log('Parsing command:', input);
    const commands = [
    // Mouse coordinate movement command
    {
      type: 'mouse_move_coords',
      pattern: /^move mouse to coordinates (\d+) (\d+)$/i,
      handler: match => ({
        type: 'mouse_move_coords',
        x: parseInt(match[1]),
        y: parseInt(match[2])
      })
    },
    // Navigation commands
    {
      type: 'navigation',
      pattern: /^(?:go|navigate|open|visit)(?:\s+to)?\s+([^\s]+)/i,
      handler: match => ({
        type: 'navigation',
        url: match[1].toLowerCase(),
        skipFirstResult: false
      })
    },
    // Basic browser commands
    {
      type: 'back',
      pattern: /^back$/i,
      handler: () => ({
        type: 'back'
      })
    }, {
      type: 'forward',
      pattern: /^forward$/i,
      handler: () => ({
        type: 'forward'
      })
    }, {
      type: 'refresh',
      pattern: /^refresh$/i,
      handler: () => ({
        type: 'refresh'
      })
    }];
    for (const command of commands) {
      const match = input.match(command.pattern);
      if (match) {
        console.log(`✅ Command matched pattern: ${command.type}`);
        return command.handler(match);
      }
    }
    console.log('❌ No pattern matched for input:', input);
    return null;
  }
}
;// ./browser_manager.js
class BrowserTabManager {
  constructor() {
    this.tabId = null;
    this.windowId = null;
    this.port = null;
    this.initializeConnection();
    console.log('🔧 Initializing BrowserTabManager');
  }
  initializeConnection() {
    this.port = chrome.runtime.connect({
      name: "qa-window"
    });
    this.port.onMessage.addListener(async message => {
      if (message.type === 'INIT_STATE') {
        this.tabId = message.browserTabId;
        try {
          const tab = await chrome.tabs.get(this.tabId);
          this.windowId = tab.windowId;
          console.log(`🔧 Initialized with browser tab ID: ${this.tabId}`);

          // Check if we're in a valid context
          if (this.isInternalUrl(tab.url)) {
            await this.createNewTab();
          } else {
            await this.ensureTabActive();
          }
        } catch (error) {
          console.error('Failed to get window ID:', error);
          await this.createNewTab();
        }
      }
    });
  }
  isInternalUrl(url) {
    if (!url) return true;
    return url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('brave://') || url.startsWith('devtools://');
  }
  async createNewTab() {
    try {
      console.log('Creating new browser tab...');
      const tab = await chrome.windows.create({
        url: 'about:blank',
        type: 'normal',
        // Changed to normal for better compatibility
        width: 1024,
        height: 768,
        focused: true
      });
      this.tabId = tab.tabs[0].id;
      this.windowId = tab.id;
      console.log(`Created new window with ID: ${this.windowId} and tab ID: ${this.tabId}`);
      await chrome.storage.local.set({
        browserTabId: this.tabId
      });
      return tab;
    } catch (error) {
      console.error('Failed to create new window:', error);
      throw error;
    }
  }
  async navigate(url) {
    try {
      await this.ensureTabActive();

      // Process the URL
      let processedUrl = url.toLowerCase().trim();
      if (!processedUrl.match(/^https?:\/\//)) {
        processedUrl = `https://${processedUrl}`;
      }
      console.log(`Navigating to: ${processedUrl}`);

      // Update the tab
      const tab = await chrome.tabs.update(this.tabId, {
        url: processedUrl
      });

      // Wait for navigation to complete
      await new Promise(resolve => {
        const listener = (tabId, changeInfo) => {
          if (tabId === this.tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        };
        chrome.tabs.onUpdated.addListener(listener);

        // Timeout after 30 seconds
        setTimeout(() => {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }, 30000);
      });

      // Additional delay to ensure page is fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-inject cursor after navigation
      await chrome.runtime.sendMessage({
        type: 'EXECUTE_COMMAND',
        command: {
          type: 'ensure_cursor'
        }
      });
      return tab;
    } catch (error) {
      console.error('Navigation failed:', error);
      throw error;
    }
  }
  async ensureTabActive() {
    if (!this.tabId || !this.windowId) {
      console.log('No active tab, creating new one...');
      await this.createNewTab();
      return;
    }
    try {
      // Check if the current tab is valid
      const tab = await chrome.tabs.get(this.tabId);
      if (this.isInternalUrl(tab.url)) {
        console.log('Current tab is internal, creating new one...');
        await this.createNewTab();
        return;
      }
      await chrome.windows.update(this.windowId, {
        focused: true
      });
      await chrome.tabs.update(this.tabId, {
        active: true
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Failed to activate tab:', error);
      await this.createNewTab();
    }
  }
  async captureScreenshot() {
    try {
      await this.ensureTabActive();

      // Check if we can capture screenshot
      const tab = await chrome.tabs.get(this.tabId);
      if (this.isInternalUrl(tab.url)) {
        console.log('Cannot capture screenshot of internal page');
        return null;
      }
      const result = await chrome.tabs.captureVisibleTab(this.windowId, {
        format: 'png',
        quality: 100
      });
      return result;
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
      return null;
    }
  }
  async executeScript(func, args = []) {
    await this.ensureTabActive();
    try {
      var _results$;
      const results = await chrome.scripting.executeScript({
        target: {
          tabId: this.tabId
        },
        function: func,
        args: args
      });
      return (_results$ = results[0]) === null || _results$ === void 0 ? void 0 : _results$.result;
    } catch (error) {
      console.error('❌ Script execution failed:', error);
      throw error;
    }
  }
}
;// ./smart_commands.js



// Smart click command that uses vision to understand and click elements
class SmartClickCommand extends Command {
  constructor(target, browserTab) {
    super();
    this.target = target;
    this.browserTab = browserTab;
    this.visionService = new VisionService();
    console.log(`🎯 Creating SmartClickCommand for: "${target}"`);
  }
  async execute() {
    try {
      console.log(`🔍 Looking for element: "${this.target}"`);

      // First, understand the page
      const screenshot = await this.browserTab.captureScreenshot();
      const elementMatch = await this.visionService.findElementByIntent(screenshot.replace(/^data:image\/[a-z]+;base64,/, ''), this.target);
      if (!elementMatch) {
        throw new Error(`Could not find element matching: "${this.target}"`);
      }
      console.log('🎯 Found matching element:', {
        description: elementMatch.description,
        confidence: elementMatch.confidence,
        location: elementMatch.location
      });

      // Click with high precision if we're confident
      if (elementMatch.confidence > 0.8) {
        const result = await this.clickWithVisionGuidance(elementMatch);
        if (result) {
          console.log('✅ Successfully clicked element');
          return true;
        }
      }

      // Fall back to traditional clicking if vision guidance fails
      console.log('⚠️ Trying traditional click methods...');
      return await this.fallbackClick();
    } catch (error) {
      console.error('❌ Smart click failed:', error);
      throw error;
    }
  }
  async clickWithVisionGuidance(elementMatch) {
    const clickScript = coords => {
      // Convert relative coordinates to pixels
      const x = Math.floor(coords.x * window.innerWidth);
      const y = Math.floor(coords.y * window.innerHeight);

      // Find and click element
      const element = document.elementFromPoint(x, y);
      if (element) {
        try {
          // Try multiple click methods
          element.click();
          return true;
        } catch (e) {
          try {
            // Create and dispatch click event
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y
            });
            element.dispatchEvent(clickEvent);
            return true;
          } catch (error) {
            console.error('Click simulation failed:', error);
            return false;
          }
        }
      }
      return false;
    };
    const result = await this.browserTab.executeScript(clickScript, [elementMatch.location]);
    if (result && result[0]) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.browserTab.captureScreenshot();
      return true;
    }
    return false;
  }
  async fallbackClick() {
    const traditionalClickScript = target => {
      // Multiple strategies to find the element
      const strategies = [
      // By text content
      () => Array.from(document.querySelectorAll('*')).find(el => {
        var _el$textContent;
        return (_el$textContent = el.textContent) === null || _el$textContent === void 0 ? void 0 : _el$textContent.toLowerCase().includes(target.toLowerCase());
      }),
      // By various attributes
      () => document.querySelector(`[aria-label*="${target}" i]`), () => document.querySelector(`[title*="${target}" i]`), () => document.querySelector(`[placeholder*="${target}" i]`),
      // By button text
      () => Array.from(document.querySelectorAll('button')).find(btn => {
        var _btn$textContent;
        return (_btn$textContent = btn.textContent) === null || _btn$textContent === void 0 ? void 0 : _btn$textContent.toLowerCase().includes(target.toLowerCase());
      })];

      // Try each strategy
      for (const strategy of strategies) {
        try {
          const element = strategy();
          if (element) {
            element.click();
            return true;
          }
        } catch (e) {
          continue;
        }
      }
      return false;
    };
    const result = await this.browserTab.executeScript(traditionalClickScript, [this.target]);
    return result && result[0];
  }
}
;// ./command_factory.js



class CommandFactory {
  static createCommand(type, params, browserTab) {
    console.log(`🏭 Creating command of type: ${type} with params:`, params);
    switch (type) {
      case 'click':
      case 'smartClick':
        return new SmartClickCommand(params.target, browserTab);
      case 'test_vision':
        return new TestVisionCommand(browserTab);
      case 'navigation':
        return new NavigationCommand(params.url, browserTab, params.skipFirstResult);
      case 'search':
        return new SearchCommand(params.query, browserTab);
      case 'back':
        return new BackCommand(browserTab);
      case 'forward':
        return new ForwardCommand(browserTab);
      case 'refresh':
        return new RefreshCommand(browserTab);
      case 'scroll':
        return new ScrollCommand(params.direction, browserTab);
      case 'find':
        return new FindCommand(params.text, browserTab);
      case 'findAndClick':
        return new FindAndClickCommand(params.text, browserTab);
      default:
        throw new Error(`Unknown command type: ${type}`);
    }
  }
}
;// ./popup.js
// Import all dependencies




// Original class definition in place
class QAInterface {
  constructor() {
    // Initialize components
    this.commandProcessor = new CommandProcessor();
    this.browserTab = new BrowserTabManager();
    this.chatHistory = [];

    // Get DOM elements
    this.input = document.querySelector('#command-input');
    this.sendButton = document.querySelector('#send-button');
    this.screenshotDiv = document.querySelector('#screenshot');
    if (!this.input || !this.sendButton || !this.screenshotDiv) {
      console.error('❌ Required DOM elements not found');
      return;
    }
    this.setupEventListeners();
    this.setupAutoResize();
    console.log('🔧 QAInterface initialized');
  }
  setupEventListeners() {
    // Send button click
    this.sendButton.addEventListener('click', e => {
      e.preventDefault();
      this.submitCommand();
    });

    // Enter key press (without shift)
    this.input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        this.submitCommand();
      }
    });

    // Input changes for auto-resize
    this.input.addEventListener('input', () => {
      this.autoResizeInput();
    });
  }
  setupAutoResize() {
    // Set initial height
    this.autoResizeInput();

    // Observe window resize
    new ResizeObserver(() => {
      this.autoResizeInput();
    }).observe(this.input);
  }
  autoResizeInput() {
    const input = this.input;
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';

    // Limit max height
    if (input.scrollHeight > 120) {
      input.style.height = '120px';
      input.style.overflowY = 'auto';
    } else {
      input.style.overflowY = 'hidden';
    }
  }
  submitCommand() {
    const command = this.input.value.trim();
    if (command) {
      this.handleCommand(command);
      this.input.value = '';
      this.autoResizeInput();
    }
  }
  addToChatHistory(entry) {
    this.chatHistory.push(entry);
    this.updateChatDisplay();
  }
  updateChatDisplay() {
    this.screenshotDiv.innerHTML = '';
    this.chatHistory.forEach((entry, index) => {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'chat-entry';

      // Add command text
      const commandDiv = document.createElement('div');
      commandDiv.className = 'command-text';
      commandDiv.textContent = `> ${entry.command}`;
      messageDiv.appendChild(commandDiv);

      // Add screenshots if any
      if (entry.screenshots && entry.screenshots.length > 0) {
        const screenshotsDiv = document.createElement('div');
        screenshotsDiv.className = 'screenshots-container';
        entry.screenshots.forEach((screenshot, idx) => {
          const wrapper = document.createElement('div');
          wrapper.className = 'screenshot-wrapper';

          // Create image
          const img = document.createElement('img');
          img.src = screenshot.data;
          img.alt = `Step ${idx + 1}`;

          // Add click handler for fullscreen
          img.addEventListener('click', () => this.showFullscreenImage(screenshot.data));

          // Add controls
          const controls = document.createElement('div');
          controls.className = 'screenshot-controls';
          const zoomButton = document.createElement('button');
          zoomButton.textContent = '🔍 View Full Size';
          zoomButton.addEventListener('click', () => this.showFullscreenImage(screenshot.data));
          controls.appendChild(zoomButton);

          // Add caption
          const caption = document.createElement('div');
          caption.className = 'screenshot-caption';
          caption.textContent = screenshot.caption || `Step ${idx + 1}`;
          wrapper.appendChild(img);
          wrapper.appendChild(controls);
          wrapper.appendChild(caption);
          screenshotsDiv.appendChild(wrapper);
        });
        messageDiv.appendChild(screenshotsDiv);
      }

      // Add any error messages
      if (entry.error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = entry.error;
        messageDiv.appendChild(errorDiv);
      }
      this.screenshotDiv.appendChild(messageDiv);
    });

    // Scroll to bottom
    this.screenshotDiv.scrollTop = this.screenshotDiv.scrollHeight;
  }
  showFullscreenImage(imageUrl) {
    const fullscreenDiv = document.createElement('div');
    fullscreenDiv.className = 'screenshot-fullscreen';
    const img = document.createElement('img');
    img.src = imageUrl;
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = '×';
    closeButton.addEventListener('click', () => fullscreenDiv.remove());

    // Close on background click
    fullscreenDiv.addEventListener('click', e => {
      if (e.target === fullscreenDiv) {
        fullscreenDiv.remove();
      }
    });
    fullscreenDiv.appendChild(img);
    fullscreenDiv.appendChild(closeButton);
    document.body.appendChild(fullscreenDiv);
  }
  async handleCommand(command) {
    const chatEntry = {
      command,
      screenshots: [],
      timestamp: new Date().toISOString()
    };
    try {
      this.disableUI();

      // Process command to get structured data
      const commandData = await this.commandProcessor.processCommand(command);
      if (!commandData) {
        throw new Error('Invalid command');
      }
      console.log('Executing command:', commandData);

      // Handle different command types
      if (commandData.type === 'navigation') {
        // Handle navigation directly through browser manager
        await this.browserTab.navigate(commandData.url);

        // Wait a bit for the page to settle
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to capture screenshot after navigation
        const screenshot = await this.browserTab.captureScreenshot();
        if (screenshot) {
          chatEntry.screenshots.push({
            data: screenshot,
            caption: 'Navigation Result'
          });
        }
      } else if (commandData.type === 'mouse_move_coords') {
        // Handle mouse movement
        await this.browserTab.executeScript(data => {
          const cursor = document.getElementById('qa-mouse-cursor');
          if (cursor) {
            cursor.style.left = `${data.x}px`;
            cursor.style.top = `${data.y}px`;
            return {
              success: true
            };
          }
          return {
            success: false,
            error: 'Cursor not found'
          };
        }, [commandData]);
      } else {
        // For other commands, send to background script
        const response = await chrome.runtime.sendMessage({
          type: 'EXECUTE_COMMAND',
          command: commandData
        });
        if (!(response !== null && response !== void 0 && response.success)) {
          throw new Error((response === null || response === void 0 ? void 0 : response.error) || 'Command execution failed');
        }
        if (response !== null && response !== void 0 && response.screenshot) {
          chatEntry.screenshots.push({
            data: response.screenshot,
            caption: 'Command Result'
          });
        }
      }
    } catch (error) {
      console.error('❌ Command execution failed:', error);
      chatEntry.error = error.message;
    } finally {
      this.addToChatHistory(chatEntry);
      this.enableUI();
      this.input.value = '';
      this.autoResizeInput();
    }
  }
  disableUI() {
    this.input.disabled = true;
    this.sendButton.disabled = true;
  }
  enableUI() {
    this.input.disabled = false;
    this.sendButton.disabled = false;
    this.input.focus();
  }
  createCommand(commandData) {
    return CommandFactory.createCommand(commandData.type, commandData.params || commandData, this.browserTab);
  }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting QA Testing Assistant...');
  window.qaInterface = new QAInterface();
});
/******/ })()
;
//# sourceMappingURL=popup.bundle.js.map