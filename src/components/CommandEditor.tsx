import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

interface CommandEditorProps {
  initialArgs: string[];
  onComplete: (args: string[]) => void;
  onCancel: () => void;
}

interface ClaudeOption {
  flags: string[];
  description: string;
  hasValue: boolean;
  valueDescription?: string;
}

const claudeOptions: ClaudeOption[] = [
  { flags: ['-h', '--help'], description: 'Display help for command', hasValue: false },
  { flags: ['-v', '--version'], description: 'Output the version number', hasValue: false },
  { flags: ['-d', '--debug'], description: 'Enable debug mode', hasValue: false },
  { flags: ['--verbose'], description: 'Override verbose mode setting from config', hasValue: false },
  { flags: ['-p', '--print'], description: 'Print response and exit (useful for pipes)', hasValue: false },
  { flags: ['--output-format'], description: 'Output format (only works with --print): "text" (default), "json" (single result), or "stream-json" (realtime streaming)', hasValue: true, valueDescription: '<format>' },
  { flags: ['--input-format'], description: 'Input format (only works with --print): "text" (default), or "stream-json" (realtime streaming input)', hasValue: true, valueDescription: '<format>' },
  { flags: ['--mcp-debug'], description: '[DEPRECATED. Use --debug instead] Enable MCP debug mode (shows MCP server errors)', hasValue: false },
  { flags: ['--dangerously-skip-permissions'], description: 'Bypass all permission checks. Recommended only for sandboxes with no internet access.', hasValue: false },
  { flags: ['--allowedTools'], description: 'Comma or space-separated list of tool names to allow (e.g. "Bash(git:*) Edit")', hasValue: true, valueDescription: '<tools...>' },
  { flags: ['--disallowedTools'], description: 'Comma or space-separated list of tool names to deny (e.g. "Bash(git:*) Edit")', hasValue: true, valueDescription: '<tools...>' },
  { flags: ['--mcp-config'], description: 'Load MCP servers from a JSON file or string', hasValue: true, valueDescription: '<file or string>' },
  { flags: ['--append-system-prompt'], description: 'Append a system prompt to the default system prompt', hasValue: true, valueDescription: '<prompt>' },
  { flags: ['--permission-mode'], description: 'Permission mode to use for the session (choices: "acceptEdits", "bypassPermissions", "default", "plan")', hasValue: true, valueDescription: '<mode>' },
  { flags: ['-c', '--continue'], description: 'Continue the most recent conversation', hasValue: false },
  { flags: ['-r', '--resume'], description: 'Resume a conversation - provide a session ID or interactively select a conversation to resume', hasValue: true, valueDescription: '[sessionId]' },
  { flags: ['--model'], description: 'Model for the current session. Provide an alias for the latest model (e.g. \'sonnet\' or \'opus\') or a model\'s full name (e.g. \'claude-sonnet-4-20250514\').', hasValue: true, valueDescription: '<model>' },
  { flags: ['--fallback-model'], description: 'Enable automatic fallback to specified model when default model is overloaded (only works with --print)', hasValue: true, valueDescription: '<model>' },
  { flags: ['--settings'], description: 'Path to a settings JSON file to load additional settings from', hasValue: true, valueDescription: '<file>' },
  { flags: ['--add-dir'], description: 'Additional directories to allow tool access to', hasValue: true, valueDescription: '<directories...>' },
  { flags: ['--ide'], description: 'Automatically connect to IDE on startup if exactly one valid IDE is available', hasValue: false },
  { flags: ['--strict-mcp-config'], description: 'Only use MCP servers from --mcp-config, ignoring all other MCP configurations', hasValue: false },
  { flags: ['--session-id'], description: 'Use a specific session ID for the conversation (must be a valid UUID)', hasValue: true, valueDescription: '<uuid>' },
];

const SAFETY_MARGIN = 1;

// Layout constants
const LAYOUT_CONSTANTS = {
  FIXED_ELEMENT_HEIGHT: 15,
  SUGGESTIONS_BASE_HEIGHT: 5,
  MAX_SUGGESTIONS_SHOWN: 5,
  MIN_OPTIONS_LIST_HEIGHT: 10,
  OPTIONS_LIST_MARGIN: 4,
  DEFAULT_TERMINAL_HEIGHT: 24
} as const;

export const CommandEditor: React.FC<CommandEditorProps> = ({ initialArgs, onComplete, onCancel }) => {
  const { stdout } = useStdout();
  const [commandLine, setCommandLine] = useState(initialArgs.join(' '));
  const [cursorPosition, setCursorPosition] = useState(commandLine.length);
  const [suggestions, setSuggestions] = useState<ClaudeOption[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  
  const terminalHeight = stdout?.rows || LAYOUT_CONSTANTS.DEFAULT_TERMINAL_HEIGHT;
  const totalHeight = terminalHeight - SAFETY_MARGIN;

  useEffect(() => {
    // Update suggestions based on current input
    const currentWord = getCurrentWord();
    if (currentWord.startsWith('-')) {
      const matching = claudeOptions.filter(opt => 
        opt.flags.some(flag => flag.toLowerCase().startsWith(currentWord.toLowerCase()))
      );
      setSuggestions(matching);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
    }
  }, [commandLine, cursorPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentWord = () => {
    const beforeCursor = commandLine.substring(0, cursorPosition);
    const words = beforeCursor.split(' ');
    return words[words.length - 1] || '';
  };

  const insertSuggestion = (suggestion: ClaudeOption) => {
    // Guard against invalid suggestions
    if (!suggestion || !suggestion.flags || suggestion.flags.length === 0) {
      return;
    }
    
    // Validate cursor position
    if (cursorPosition < 0 || cursorPosition > commandLine.length) {
      return;
    }
    
    const beforeCursor = commandLine.substring(0, cursorPosition);
    const afterCursor = commandLine.substring(cursorPosition);
    const words = beforeCursor.split(' ');
    const currentWord = words[words.length - 1] || '';
    
    // Replace the current word with the suggestion
    const beforeWord = beforeCursor.substring(0, beforeCursor.length - currentWord.length);
    // Use the flag that matches the current input, or the last (long form) flag
    const matchingFlag = suggestion.flags.find(flag => flag.toLowerCase().startsWith(currentWord.toLowerCase())) || suggestion.flags[suggestion.flags.length - 1];
    // Always add a space after the flag to prevent re-matching
    const newCommand = beforeWord + matchingFlag + ' ' + afterCursor;
    setCommandLine(newCommand);
    setCursorPosition(beforeWord.length + matchingFlag.length + 1);
  };

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    
    if (key.ctrl && input === 'c') {
      onCancel();
      return;
    }

    if (key.return) {
      if (suggestions.length > 0) {
        // If suggestions are shown, insert the selected one
        insertSuggestion(suggestions[selectedSuggestion]);
      } else {
        // Otherwise, complete the editing
        const args = commandLine.trim().split(/\s+/).filter(arg => arg.length > 0);
        onComplete(args);
      }
      return;
    }

    // Navigation in suggestions
    if (suggestions.length > 0) {
      if (key.upArrow) {
        setSelectedSuggestion(prev => Math.max(0, prev - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1));
        return;
      }
      if (key.tab) {
        insertSuggestion(suggestions[selectedSuggestion]);
        return;
      }
    }

    // Text editing
    if (key.leftArrow) {
      setCursorPosition(prev => Math.max(0, prev - 1));
    } else if (key.rightArrow) {
      setCursorPosition(prev => Math.min(commandLine.length, prev + 1));
    } else if (key.backspace || key.delete) {
      if (cursorPosition > 0) {
        setCommandLine(prev => 
          prev.substring(0, cursorPosition - 1) + prev.substring(cursorPosition)
        );
        setCursorPosition(prev => prev - 1);
      }
    } else if (input && !key.ctrl && !key.meta) {
      setCommandLine(prev => 
        prev.substring(0, cursorPosition) + input + prev.substring(cursorPosition)
      );
      setCursorPosition(prev => prev + input.length);
    }
  });

  // Calculate display with cursor
  const displayCommand = () => {
    const before = commandLine.substring(0, cursorPosition);
    const at = commandLine[cursorPosition] || ' ';
    const after = commandLine.substring(cursorPosition + 1);
    
    return (
      <>
        <Text>{before}</Text>
        <Text inverse>{at}</Text>
        <Text>{after}</Text>
      </>
    );
  };

  // Calculate dynamic heights
  // Fixed elements: title (1) + help text (1) + command box (2) + disclaimer (4) + shortcuts (1) + borders (2) + padding (2) + margins (2) = 15
  const fixedHeight = LAYOUT_CONSTANTS.FIXED_ELEMENT_HEIGHT;
  
  // Height for suggestions if shown: title (1) + items + help (1) + borders (2) + margin (1) = 5 + items
  const suggestionsHeight = suggestions.length > 0 
    ? LAYOUT_CONSTANTS.SUGGESTIONS_BASE_HEIGHT + Math.min(suggestions.length, LAYOUT_CONSTANTS.MAX_SUGGESTIONS_SHOWN) 
    : 0;
  
  // Calculate remaining height for options list
  const remainingHeight = totalHeight - fixedHeight - suggestionsHeight;
  const optionsListHeight = Math.max(
    LAYOUT_CONSTANTS.MIN_OPTIONS_LIST_HEIGHT, 
    remainingHeight - LAYOUT_CONSTANTS.OPTIONS_LIST_MARGIN
  );

  return (
    <Box height={totalHeight} flexDirection="column">
      <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} paddingY={1}>
        <Text bold color="cyan">Claude Command Editor</Text>
        <Text dimColor>Edit command options for Claude. Press Enter to confirm, Esc to cancel.</Text>
        
        <Box marginTop={1}>
          <Text bold>Command: </Text>
          <Text>claude </Text>
          {displayCommand()}
        </Box>

        {suggestions.length > 0 && (
          <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
            <Text bold>Suggestions:</Text>
            {suggestions.slice(0, LAYOUT_CONSTANTS.MAX_SUGGESTIONS_SHOWN).map((suggestion, index) => {
              const flagText = suggestion.flags.join(', ');
              const isSelected = index === selectedSuggestion;
              return (
                <Box key={flagText}>
                  <Text color={isSelected ? 'green' : 'white'}>
                    {isSelected ? '▶ ' : '  '}
                    <Text bold>{flagText}</Text>
                    {' - '}
                    <Text dimColor>{suggestion.description}</Text>
                  </Text>
                </Box>
              );
            })}
            <Box marginTop={1}>
              <Text dimColor>↑↓ to navigate, Tab/Enter to select</Text>
            </Box>
          </Box>
        )}

        <Box marginTop={1} flexDirection="column">
          <Text bold>Available Options:</Text>
          <Box flexDirection="column" height={optionsListHeight} overflow="hidden">
            {claudeOptions.map(option => {
              const flagDisplay = option.flags.join(', ') + (option.valueDescription ? ` ${option.valueDescription}` : '');
              const paddedFlag = flagDisplay.padEnd(35);
              return (
                <Text key={option.flags.join(',')} dimColor>
                  <Text>{paddedFlag}</Text>
                  {option.description}
                </Text>
              );
            })}
          </Box>
        </Box>

        <Box marginTop={1} flexDirection="column">
          <Text dimColor>
            ⚠️  Note: This list is based on claude --help at a specific point in time.
          </Text>
          <Text dimColor>
            Please refer to official docs for the latest valid options.
          </Text>
          <Text dimColor>
            Options like -r, -c, -h may cause ccresume to malfunction.
          </Text>
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            Shortcuts: Enter=confirm, Esc=cancel, ←/→=move cursor, Tab=autocomplete
          </Text>
        </Box>
      </Box>
    </Box>
  );
};