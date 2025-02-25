#!/bin/bash

# Startup script for Playwright service with improved error handling

echo "🚀 Starting Playwright Service..."

# Set the directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if the service is already running
RUNNING_PID=$(lsof -ti:3001)
if [ ! -z "$RUNNING_PID" ]; then
    echo "⚠️  Playwright service already running on port 3001 (PID: $RUNNING_PID)"
    echo "Stopping existing service..."
    kill -9 $RUNNING_PID
    sleep 2
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/playwright" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the service with better error handling
echo "🚀 Starting Playwright service on port 3001..."
node server.js > playwright_service.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for service to initialize..."
sleep 3

# Check if the server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Playwright service started successfully (PID: $SERVER_PID)"
    echo "📝 Logs available in playwright_service.log"
    # Save PID to file for later use
    echo $SERVER_PID > .service.pid
else
    echo "❌ Failed to start Playwright service"
    echo "Check playwright_service.log for details"
    exit 1
fi

# Verify endpoint is accessible
HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
if [[ $HEALTH_CHECK == *"status"*"ok"* ]]; then
    echo "✅ Health check successful"
else
    echo "⚠️  Health check failed, but service may still be starting..."
fi

echo "🔗 Service URL: http://localhost:3001"
echo "To stop the service: kill $(cat .service.pid)"
