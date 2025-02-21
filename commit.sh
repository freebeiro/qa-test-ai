#!/bin/bash

# Add all changes
git add .

# Create commit with detailed message
git commit -m "feat: Add Ollama vision model integration

- Integrate llama3.2-vision model for webpage analysis
- Add 'test vision' command to extension
- Update documentation with vision features
- Improve error handling and logging
- Add CORS support for Ollama communication
- Update manifest.json for API access
- Add proper base64 image handling
- Enhance markdown documentation

Testing Instructions:
1. Run Ollama with: OLLAMA_ORIGINS=\"*\" ollama serve
2. Ensure llama3.2-vision model is installed
3. Rebuild extension with ./rebuild.sh
4. Test vision analysis with 'test vision' command"