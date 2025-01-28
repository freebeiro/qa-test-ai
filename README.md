# QA Testing Assistant Chrome Extension

This Chrome extension provides an intelligent interface for automated QA testing using natural language commands. It combines AI capabilities with browser automation to create comprehensive test documentation with minimal effort.

## Prerequisites

- Docker Desktop (latest version)
- Google Chrome Browser
- Git and Git LFS
- Python 3.9+

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd chrome_extension_for_qa_testing_9lhj5c
```

2. Run the setup script:
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Check for required dependencies (Docker, Git LFS)
- Download the UI-TARS model if not present (~14GB)
- Start the necessary Docker services
- Prepare the environment for the Chrome extension

## Manual Model Setup (if needed)

If you need to manually download the model:

1. Install Git LFS:
```bash
git lfs install
```

2. Download the model:
```bash
./download_model.sh
```

The model files will be downloaded to `ui-tars/ui-tars-7b-dpo/`.

## Loading the Extension

1. Open Google Chrome
2. Go to chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the project directory

## Usage

1. Click the extension icon in Chrome
2. Enter natural language commands like:
   - "go to example.com"
   - "search for 'test query'"
   - "click the login button"
3. The extension will:
   - Execute your commands
   - Take screenshots
   - Generate PDF reports

## Development Notes

- Model files (~14GB) are not included in the repository
- They are downloaded automatically on first setup
- The UI-TARS model is stored in `ui-tars/ui-tars-7b-dpo/`
- Docker services run on ports 8001 (UI-TARS) and 8002 (PDF Generator)

## Troubleshooting

If you encounter issues:

1. Verify model files:
```bash
./download_model.sh
```

2. Restart services:
```bash
docker-compose down
docker-compose up --build -d
```

3. Check logs:
```bash
docker-compose logs -f ui-tars
```

## License

[License details]