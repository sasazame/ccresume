#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import App from './App.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get command line arguments (excluding node and script path)
const args = process.argv.slice(2);

// Handle --help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`ccresume - TUI for browsing Claude Code conversations

Usage: ccresume [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version number

All other options are passed to claude when resuming a conversation.

Keyboard Controls:
  ↑/↓           Navigate conversations list
  j/k           Scroll chat history  
  Enter         Resume selected conversation
  c             Copy session ID
  q             Quit

Examples:
  ccresume
  ccresume --dangerously-skip-permissions
  
For more info: https://github.com/sasazame/ccresume`);
  process.exit(0);
}

// Handle --version
if (args.includes('--version') || args.includes('-v')) {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(packageJson.version);
  process.exit(0);
}

const claudeArgs = args;

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