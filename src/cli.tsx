#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './App.js';

// Get command line arguments (excluding node and script path)
const claudeArgs = process.argv.slice(2);

// Clear the screen before rendering
console.clear();

// Render the app in fullscreen mode
const { unmount } = render(<App claudeArgs={claudeArgs} />, {
  exitOnCtrlC: true
});

// Handle graceful exit
process.on('exit', () => {
  unmount();
});