#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
mkdir -p pdf-service/reports

# Start services
echo "Starting services..."
docker-compose up --build -d

echo "Waiting for services to start..."
sleep 10

echo "Setup complete! You can now:"
echo "1. Load the Chrome extension from chrome://extensions/ (Developer mode enabled)"
echo "2. Click the extension icon to start QA testing"
echo "3. Use natural language to instruct the AI"
echo "4. Click 'Generate PDF Report' when done"