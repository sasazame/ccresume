import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { ConversationList } from './components/ConversationList.js';
import { ConversationPreview } from './components/ConversationPreview.js';
import { getPaginatedConversations } from './utils/conversationReader.js';
import { spawn } from 'child_process';
import clipboardy from 'clipboardy';
import type { Conversation } from './types.js';
import { loadConfig } from './utils/configLoader.js';
import { matchesKeyBinding } from './utils/keyBindingHelper.js';
import type { Config } from './types/config.js';

interface AppProps {
  claudeArgs?: string[];
  currentDirOnly?: boolean;
  hideOptions?: string[];
}

// Layout constants
const ITEMS_PER_PAGE = 30;
const HEADER_HEIGHT = 2; // Title + pagination info
const LIST_MAX_HEIGHT = 9; // Maximum height for conversation list
const LIST_BASE_HEIGHT = 3; // Borders (2) + title (1)
const MAX_VISIBLE_CONVERSATIONS = 4; // Maximum conversations shown per page
const BOTTOM_MARGIN = 1; // Bottom margin to absorb overflow
const SAFETY_MARGIN = 1; // Prevents Ink from clearing terminal when output approaches height limit
const MIN_PREVIEW_HEIGHT = 10; // Minimum height for conversation preview
const DEFAULT_TERMINAL_WIDTH = 80;
const DEFAULT_TERMINAL_HEIGHT = 24;
const EXECUTE_DELAY_MS = 500; // Delay before executing command to show status
const STATUS_MESSAGE_DURATION_MS = 2000; // Duration to show status messages

const App: React.FC<AppProps> = ({ claudeArgs = [], currentDirOnly = false, hideOptions = [] }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: DEFAULT_TERMINAL_WIDTH, height: DEFAULT_TERMINAL_HEIGHT });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [paginating, setPaginating] = useState(false);

  useEffect(() => {
    // Load config on mount
    const loadedConfig = loadConfig();
    setConfig(loadedConfig);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [currentDirOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Update dimensions on terminal resize
    const updateDimensions = () => {
      setDimensions({
        width: stdout.columns || DEFAULT_TERMINAL_WIDTH,
        height: stdout.rows || DEFAULT_TERMINAL_HEIGHT
      });
    };
    
    updateDimensions();
    if (stdout) {
      stdout.on('resize', updateDimensions);
      return () => {
        stdout.off('resize', updateDimensions);
      };
    }
    return undefined;
  }, [stdout]);

  const executeClaudeCommand = (
    conversation: Conversation,
    args: string[],
    statusMsg: string,
    actionType: 'resume' | 'start'
  ) => {
    const commandStr = `claude ${args.join(' ')}`;
    setStatusMessage(statusMsg);
    
    setTimeout(() => {
      exit();
      
      // Output helpful information
      if (actionType === 'resume') {
        console.log(`\nResuming conversation: ${conversation.sessionId}`);
      } else {
        console.log(`\nStarting new session in: ${conversation.projectPath}`);
      }
      console.log(`Directory: ${conversation.projectPath}`);
      console.log(`Executing: ${commandStr}`);
      console.log('---');
      
      // Windows-specific reminder
      if (process.platform === 'win32') {
        console.log('💡 Reminder: If input doesn\'t work, press ENTER to activate.');
        console.log('');
      }
      
      // Spawn claude process
      const claude = spawn(commandStr, {
        stdio: 'inherit',
        cwd: conversation.projectPath,
        shell: true
      });
      
      claude.on('error', (err) => {
        console.error(`\nFailed to ${actionType} ${actionType === 'resume' ? 'conversation' : 'new session'}:`, err.message);
        console.error('Make sure Claude Code is installed and available in PATH');
        console.error(`Or the project directory might not exist: ${conversation.projectPath}`);
        
        // For resume action, provide clipboard fallback
        if (actionType === 'resume') {
          try {
            clipboardy.writeSync(conversation.sessionId);
            console.log(`\nSession ID copied to clipboard: ${conversation.sessionId}`);
            console.log(`Project directory: ${conversation.projectPath}`);
            console.log(`You can manually run:`);
            console.log(`  cd "${conversation.projectPath}"`);
            const argsStr = claudeArgs.length > 0 ? claudeArgs.join(' ') + ' ' : '';
            console.log(`  claude ${argsStr}--resume ${conversation.sessionId}`);
          } catch (clipErr) {
            console.error('Failed to copy to clipboard:', clipErr instanceof Error ? clipErr.message : String(clipErr));
          }
        }
        
        process.exit(1);
      });
      
      claude.on('close', (code) => {
        process.exit(code || 0);
      });
    }, EXECUTE_DELAY_MS);
  };

  const loadConversations = async (isPaginating = false) => {
    try {
      if (isPaginating) {
        setPaginating(true);
        setConversations([]); // Clear current conversations
      } else {
        setLoading(true);
      }
      
      const currentDir = currentDirOnly ? process.cwd() : undefined;
      
      // Load paginated conversations
      const offset = currentPage * ITEMS_PER_PAGE;
      const { conversations: convs, total } = await getPaginatedConversations({
        limit: ITEMS_PER_PAGE,
        offset,
        currentDirFilter: currentDir
      });
      setConversations(convs);
      setTotalCount(total);
      
      setLoading(false);
      setPaginating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setLoading(false);
      setPaginating(false);
    }
  };

  // Track previous page for detecting page changes
  const [prevPage, setPrevPage] = useState(0);
  
  // Reload conversations when page changes
  useEffect(() => {
    const isPaginating = currentPage !== prevPage;
    setPrevPage(currentPage);
    loadConversations(isPaginating);
  }, [currentPage, currentDirOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  useInput((input, key) => {
    if (!config) return;
    
    if (matchesKeyBinding(input, key, config.keybindings.quit)) {
      exit();
    }

    if (loading || conversations.length === 0) return;

    // Calculate pagination values
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    
    if (matchesKeyBinding(input, key, config.keybindings.selectPrevious)) {
      if (selectedIndex === 0 && currentPage > 0) {
        // Auto-navigate to previous page when at first item
        setCurrentPage(prev => prev - 1);
        setSelectedIndex(ITEMS_PER_PAGE - 1); // Select last item of previous page
      } else {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      }
    }
    
    if (matchesKeyBinding(input, key, config.keybindings.selectNext)) {
      const maxIndex = conversations.length - 1;
      const canGoNext = totalCount === -1 ? conversations.length === ITEMS_PER_PAGE : currentPage < totalPages - 1;
      if (selectedIndex === maxIndex && canGoNext) {
        // Auto-navigate to next page when at last item
        setCurrentPage(prev => prev + 1);
        setSelectedIndex(0); // Select first item of next page
      } else {
        setSelectedIndex((prev) => Math.min(maxIndex, prev + 1));
      }
    }
    
    // Page navigation with arrow keys and n/p
    if (matchesKeyBinding(input, key, config.keybindings.pageNext)) {
      // For unknown total (-1), allow next if we got full page
      if (totalCount === -1 ? conversations.length === ITEMS_PER_PAGE : currentPage < totalPages - 1) {
        setCurrentPage(prev => prev + 1);
        setSelectedIndex(0); // Reset selection to first item of new page
      }
    }
    
    if (matchesKeyBinding(input, key, config.keybindings.pagePrevious) && currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      setSelectedIndex(0); // Reset selection to first item of new page
    }
    

    if (matchesKeyBinding(input, key, config.keybindings.confirm)) {
      const selectedConv = conversations[selectedIndex];
      if (selectedConv) {
        const commandArgs = [...claudeArgs, '--resume', selectedConv.sessionId];
        const commandStr = `claude ${commandArgs.join(' ')}`;
        executeClaudeCommand(
          selectedConv, 
          commandArgs, 
          `Executing: ${commandStr}`,
          'resume'
        );
      }
    }

    if (matchesKeyBinding(input, key, config.keybindings.copySessionId)) {
      // Copy session ID to clipboard
      const selectedConv = conversations[selectedIndex];
      if (selectedConv) {
        try {
          clipboardy.writeSync(selectedConv.sessionId);
          // Show temporary status message
          setStatusMessage('✓ Session ID copied to clipboard!');
          setTimeout(() => setStatusMessage(null), STATUS_MESSAGE_DURATION_MS);
        } catch {
          setStatusMessage('✗ Failed to copy to clipboard');
          setTimeout(() => setStatusMessage(null), STATUS_MESSAGE_DURATION_MS);
        }
      }
    }

    if (matchesKeyBinding(input, key, config.keybindings.startNewSession)) {
      // Start new session without resuming
      const selectedConv = conversations[selectedIndex];
      if (selectedConv) {
        const commandArgs = [...claudeArgs];
        executeClaudeCommand(
          selectedConv,
          commandArgs,
          `Starting new session in: ${selectedConv.projectPath}`,
          'start'
        );
      }
    }

  });

  if (loading) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color="cyan">Loading conversations...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" paddingY={1}>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  // Get the selected conversation
  const selectedConversation = conversations[selectedIndex] || null;
  
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  // Calculate heights for fixed layout
  const headerHeight = HEADER_HEIGHT;
  const listMaxHeight = LIST_MAX_HEIGHT;
  const visibleConversations = Math.min(MAX_VISIBLE_CONVERSATIONS, conversations.length);
  // List height calculation: 
  // LIST_BASE_HEIGHT includes borders (2) + title (1)
  const needsMoreIndicator = conversations.length > visibleConversations ? 1 : 0;
  const listHeight = Math.min(listMaxHeight, LIST_BASE_HEIGHT + visibleConversations + needsMoreIndicator);
  
  // Add safety margin to prevent exceeding terminal height
  const safetyMargin = SAFETY_MARGIN;
  const bottomMargin = BOTTOM_MARGIN;
  const totalUsedHeight = headerHeight + listHeight + bottomMargin + safetyMargin;
  const previewHeight = Math.max(MIN_PREVIEW_HEIGHT, dimensions.height - totalUsedHeight);

  return (
    <Box flexDirection="column" width={dimensions.width} paddingX={1} paddingY={0}>
      <Box height={headerHeight} flexDirection="column">
        <Text bold color="cyan">ccresume - Claude Code Conversation Browser</Text>
        <Box>
          <Text dimColor>
            {(() => {
              const prevKeys = config?.keybindings.pagePrevious.map(k => k === 'left' ? '←' : k).join('/') || '←';
              const nextKeys = config?.keybindings.pageNext.map(k => k === 'right' ? '→' : k).join('/') || '→';
              const pageHelp = `Press ${prevKeys}/${nextKeys} for pages`;
              
              return totalCount === -1 ? (
                <>Page {currentPage + 1} | {pageHelp}</>
              ) : (
                <>{totalCount} total | Page {currentPage + 1}/{totalPages || 1} | {pageHelp}</>
              );
            })()}
          </Text>
        </Box>
      </Box>
      
      <Box height={listHeight}>
        <ConversationList 
          conversations={conversations} 
          selectedIndex={selectedIndex}
          maxVisible={visibleConversations}
          isLoading={paginating}
        />
      </Box>
      
      <Box height={previewHeight}>
        <ConversationPreview conversation={selectedConversation} statusMessage={statusMessage} hideOptions={hideOptions} />
      </Box>
      
      {/* Bottom margin to absorb any overflow */}
      <Box height={bottomMargin} />
    </Box>
  );
};

export default App;