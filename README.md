# QA Testing Assistant with Vision-Language AI

The QA Testing Assistant is an innovative Chrome extension that revolutionizes web testing by combining vision-language AI with natural language processing. Built on ByteDance's UI-TARS model, it understands both visual and textual aspects of web pages, enabling testers to conduct sophisticated testing through simple conversational commands.

## Understanding How It Works

Our system operates like an experienced QA tester who can both see and understand web pages. When you give it a command like "click the login button," it:

1. Captures a screenshot of the current page
2. Analyzes the visual layout and structure
3. Understands the relationships between elements
4. Executes precise actions based on visual context
5. Documents everything automatically

This approach is fundamentally different from traditional automation tools because it understands web pages the way humans do, combining visual and textual information to make intelligent decisions.

## Key Features

Our QA Testing Assistant brings several innovative capabilities to web testing:

- **Natural Language Control**: Issue commands in plain English, just as you would instruct another person.
- **Visual Understanding**: The system sees and understands webpage layouts, making it more reliable than traditional selector-based automation.
- **Intelligent Navigation**: Automatically handles complex workflows by understanding the visual context of web pages.
- **Automatic Documentation**: Captures screenshots and generates comprehensive test reports automatically.
- **Error Recovery**: Uses visual understanding to adapt when elements change or move on the page.

## Technical Architecture

The system is built on three main components:

1. **Chrome Extension Frontend**:
   - Provides an intuitive chat-like interface
   - Captures high-quality screenshots
   - Manages browser interactions
   - Handles real-time feedback

2. **UI-TARS Vision-Language Service** (Port 8001):
   - Processes both visual and textual inputs
   - Analyzes webpage structure
   - Plans and executes interactions
   - Provides intelligent error recovery

3. **PDF Documentation Service** (Port 8002):
   - Generates comprehensive test reports
   - Includes annotated screenshots
   - Documents test steps and results
   - Maintains session history

## Prerequisites

Before installing the QA Testing Assistant, ensure you have:

- Docker Desktop installed and running
- Google Chrome Browser (latest version)
- Git with LFS support enabled
- At least 16GB of RAM (24GB recommended)
- 20GB of free disk space

## Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd chrome_extension_for_qa_testing_9lhj5c
\`\`\`

2. Run the setup script:
\`\`\`bash
chmod +x setup.sh
./setup.sh
\`\`\`

The setup process will:
- Verify system requirements
- Download the UI-TARS vision-language model
- Configure Docker services
- Prepare the extension environment

## Loading the Extension

1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the project directory
4. The QA Testing Assistant icon will appear in your toolbar

## Using the Assistant

The QA Testing Assistant supports various types of commands:

1. **Basic Navigation**:
   \`\`\`
   "Go to example.com"
   "Navigate to the login page"
   \`\`\`

2. **Intelligent Interactions**:
   \`\`\`
   "Click the submit button near the email field"
   "Find the search box and type 'test query'"
   \`\`\`

3. **Complex Workflows**:
   \`\`\`
   "Log in using test@example.com and password123"
   "Add the first item from the search results to the cart"
   \`\`\`

## Development and Customization

The system is designed for extensibility:

1. **Model Configuration**:
   - UI-TARS model settings in \`ui-tars/ui-tars-7b-dpo/\`
   - Vision processing parameters in \`preprocessor_config.json\`

2. **Docker Services**:
   - UI-TARS service on port 8001
   - PDF Generator on port 8002
   - Configuration in \`docker-compose.yml\`

3. **Extension Components**:
   - Frontend interface in \`popup.js\`
   - Command processing in \`command_processor.js\`
   - Background services in \`background.js\`

## Troubleshooting

If you encounter issues:

1. **Check Services**:
   \`\`\`bash
   docker-compose logs -f ui-tars
   \`\`\`

2. **Verify Model**:
   \`\`\`bash
   ./verify_model.sh
   \`\`\`

3. **Reset System**:
   \`\`\`bash
   docker-compose down
   docker system prune -f
   docker-compose up --build -d
   \`\`\`

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with detailed description
4. Ensure all tests pass

## License

[Your License Information]

## Acknowledgments

This project builds upon:
- ByteDance's UI-TARS vision-language model
- Chrome Extension APIs
- Docker containerization
- FastAPI web framework