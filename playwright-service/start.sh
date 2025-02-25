#!/bin/bash

# Kill any existing node processes using port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Install dependencies if needed
npm install

# Start the server
node server.js 