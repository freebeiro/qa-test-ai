# QA Testing Assistant Chrome Extension

This Chrome extension provides an intelligent interface for automated QA testing using natural language commands. It combines AI capabilities with browser automation to create comprehensive test documentation with minimal effort.

## Features

The QA Testing Assistant offers several powerful features that streamline the testing process:

- Natural language command interpretation
- Automated browser interaction
- Automatic screenshot capture
- PDF report generation
- Intelligent context understanding
- Step-by-step test documentation

## Prerequisites

Before installing the extension, ensure you have the following prerequisites installed:

- Docker Desktop (latest version)
- Google Chrome Browser
- Git (for cloning the repository)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd chrome_extension_for_qa_testing_9lhj5c
```

### 2. Configure Docker Services

The extension relies on two Docker services:
- UI-TARS Service (Port 8001): Handles command interpretation and execution
- PDF Generation Service (Port 8002): Creates test documentation reports

Docker services are configured through docker-compose.yml and will be started automatically by the setup script.

### 3. Start the Services

Run the setup script to initialize all required services:

```bash
chmod +x setup.sh
./setup.sh
```

This script will:
- Check for Docker installation
- Create necessary directories
- Build and start both Docker containers
- Configure the services on the correct ports

### 4. Install the Chrome Extension

1. Open Google Chrome
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Navigate to the project directory and select it

## Usage

### Basic Operation

1. Navigate to any webpage (not a chrome:// page)
2. Click the extension icon in your Chrome toolbar
3. Enter commands in natural language in the chat interface
4. Watch as the extension executes your commands and captures screenshots
5. Generate a PDF report when your testing session is complete

### Command Examples

The extension understands various types of commands:

- Navigation: "go to example.com"
- Interaction: "click the login button"
- Form Filling: "type 'test@example.com' into the email field"
- Verification: "check if the error message appears"

### PDF Report Generation

After completing your test steps, click the "Generate PDF" button to create a comprehensive report including:
- All executed commands
- Screenshots of each step
- Timestamps and results
- Any additional context or notes provided

## Directory Structure

```
project/
├── manifest.json          # Extension configuration
├── popup.html            # Extension interface
├── popup.js              # Core extension logic
├── content.js            # Page interaction scripts
├── background.js         # Background processes
├── docker-compose.yml    # Service orchestration
├── ui-tars/             # UI-TARS service
└── pdf-service/         # PDF generation service
```

## Troubleshooting

### Common Issues

1. If Docker services fail to start:
   ```bash
   docker-compose down
   docker-compose up --build -d
   ```

2. If the extension can't connect to services:
   - Verify ports 8001 and 8002 are not in use
   - Check Docker containers are running: `docker-compose ps`
   - Review Docker logs: `docker-compose logs`

3. For permission issues with Docker:
   - Open Docker Desktop
   - Go to Settings → Resources → File Sharing
   - Add the project directory to shared paths

### Port Configuration

The services use the following ports:
- UI-TARS: 8001 (external) → 8000 (internal)
- PDF Service: 8002 (external) → 8000 (internal)

## Best Practices

1. Always start with a clear webpage before using commands
2. Use specific, clear commands for best results
3. Allow time for page loading between actions
4. Review screenshots to ensure actions completed correctly
5. Generate PDF reports after completing related test scenarios

## Security Notes

The extension requires certain permissions to function:
- activeTab: For interacting with the current tab
- scripting: For executing commands
- host permissions: For navigating to websites

## Development

For developers looking to modify or enhance the extension:

1. Service Endpoints:
   - UI-TARS API: http://localhost:8001/v1/chat/completions
   - PDF Service: http://localhost:8002/generate-pdf

2. Key Files:
   - popup.js: Main extension logic
   - config.js: Service configuration
   - ui_tars_server.py: UI-TARS service implementation
   - pdf_server.py: PDF generation service

## License

[License details here]

## Contributing

[Contribution guidelines here]
