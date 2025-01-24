# QA Testing Chrome Extension

## Environment Setup

### UI-TARS Service
```bash
python -m venv ui-tars-venv
source ui-tars-venv/bin/activate
pip install -r ui-tars-requirements.txt
```

### PDF Generation Service 
```bash
python -m venv pdf-service-venv
source pdf-service-venv/bin/activate
pip install -r pdf-service-requirements.txt
```

## Running Services
1. Start UI-TARS API:
```bash
python -m vllm.entrypoints.openai.api_server --served-model-name ui-tars --model <path_to_model>
```

2. Start PDF Service:
```bash
uvicorn pdf_server:app --reload
