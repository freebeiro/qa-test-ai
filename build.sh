#!/bin/bash
mkdir -p dist
npx webpack --mode production
echo "Build completed!"
