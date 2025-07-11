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

// Check if '.' is present as a standalone argument - indicates current directory filtering
const currentDirOnly = args.includes('.');
let filteredArgs = args.filter(arg => arg !== '.');

// Parse --hide option
let hideOptions: string[] = [];
const hideIndex = filteredArgs.findIndex(arg => arg === '--hide');
if (hideIndex !== -1) {
  // Valid hide options
  const validHideOptions = ['tool', 'thinking', 'user', 'assistant'];
  
  // Collect all arguments after --hide until the next option or end
  let i = hideIndex + 1;
  let argCount = 0;
  while (i < filteredArgs.length && !filteredArgs[i].startsWith('-')) {
    const arg = filteredArgs[i];
    // Only add valid hide options
    if (validHideOptions.includes(arg)) {
      hideOptions.push(arg);
      argCount++;
      i++;
    } else {
      // Stop collecting if we hit an invalid hide option
      // This argument might be meant for claude
      break;
    }
  }
  
  // If no arguments provided, use default: tool and thinking
  if (hideOptions.length === 0) {
    hideOptions = ['tool', 'thinking'];
  }
  
  // Remove --hide and its arguments from filteredArgs
  filteredArgs = [
    ...filteredArgs.slice(0, hideIndex),
    ...filteredArgs.slice(hideIndex + 1 + argCount)
  ];
}

// Handle --help
if (filteredArgs.includes('--help') || filteredArgs.includes('-h')) {
  console.log(`ccresume - TUI for browsing Claude Code conversations

Usage: ccresume [.] [options]

Options:
  .                    Filter conversations to current directory only
  --hide [types...]    Hide specific message types (tool, thinking, user, assistant)
                       Default: tool thinking (when no types specified)
  -h, --help           Show this help message
  -v, --version        Show version number

All other options are passed to claude when resuming a conversation.

Keyboard Controls:
  ↑/↓           Navigate conversations list
  ←/→           Navigate between pages
  j/k           Scroll chat history  
  Enter         Resume selected conversation
  c             Copy session ID
  q             Quit

Examples:
  ccresume
  ccresume .
  ccresume . --dangerously-skip-permissions
  ccresume --dangerously-skip-permissions
  
For more info: https://github.com/sasazame/ccresume`);
  process.exit(0);
}

// Handle --version
if (filteredArgs.includes('--version') || filteredArgs.includes('-v')) {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  console.log(packageJson.version);
  process.exit(0);
}

const claudeArgs = filteredArgs;

// Clear the screen before rendering
console.clear();

// Render the app in fullscreen mode
const { unmount } = render(<App claudeArgs={claudeArgs} currentDirOnly={currentDirOnly} hideOptions={hideOptions} />, {
  exitOnCtrlC: true
});

// Handle graceful exit
process.on('exit', () => {
  unmount();
});