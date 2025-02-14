# QA Testing Assistant

This Chrome extension allows you to control the browser using natural language commands. It's designed to assist with QA testing by simplifying common browser interactions.

## Features

*   **Navigation:** Navigate to URLs, go back/forward, and refresh the page.
*   **Searching:** Perform web searches.
*   **Finding Elements:** Find and highlight text on the page.
*   **Clicking Elements:** Click on elements based on text content or index.
*   **Scrolling:** Scroll the page up, down, to the top, or to the bottom.
* **UI-TARS Integration:** (Experimental) Uses the UI-TARS model for improved UI interaction (requires setting the `MIDSCENE_USE_VLM_UI_TARS` environment variable to `1` in a `.env` file).

## Supported Commands

Here are some examples of supported commands:

*   `go to example.com`
*   `back`
*   `forward`
*   `refresh`
*   `search for "my search query"`
*   `find "text on page"`
*   `click "button text"`
*   `enter "text"`
*   `scroll down`
*   `scroll up`
*   `scroll to top`
*   `scroll to bottom`
* `enter the first item containing "some text"`
* `enter the 3rd item with price 12.99`

## Architecture

The extension consists of a popup UI (HTML, CSS, JavaScript), a background script (JavaScript), and content scripts (JavaScript). Webpack is used to bundle the code. The core logic is organized into several modules:

*   **`popup.js`:** Handles the popup UI, user input, and communication with the background script.
*   **`background.js`:** Manages the extension's state and communication between the popup and content scripts.
*   **`content-script.js`:** Injected into web pages to interact with the DOM.
*   **`core/`:** Contains core components like `command_processor.js`, `command_factory.js`, `browser_tab_manager.js`, and `ui_manager.js`.
*   **`commands/`:** Contains individual command classes (e.g., `navigation_command.js`, `search_command.js`).

See `ARCHITECTURE.md` for a more detailed explanation.

## Prerequisites

*   Google Chrome Browser (latest version)
*   Node.js and npm (for building the extension)
*   Developer mode enabled in Chrome

## Installation and Usage

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  Install dependencies:
    ```
    npm install
    ```

3. Build the extension:
    ```
    npm run build
    ```
    This will create a `dist` directory containing the bundled extension files.

4.  Load the extension in Chrome:
    *   Open Chrome and go to `chrome://extensions`.
    *   Enable "Developer mode" (toggle in the top right corner).
    *   Click "Load unpacked".
    *   Select the `dist` directory.

5.  Usage:
    * Click the extension icon in the toolbar to open the popup.
    * Enter a command in the input field and click "Send" or press Enter.

## (Optional) UI-TARS Integration
To use the UI-TARS model, you need to have it set up and running. You also need to create a `.env` file in the root of the project and add the following line:
```
MIDSCENE_USE_VLM_UI_TARS=1
