#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Run the built CLI
echo "Running ccresume..."
node dist/cli.js