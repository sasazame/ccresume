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

const App: React.FC<AppProps> = ({ claudeArgs = [], currentDirOnly = false, hideOptions = [] }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 80, height: 24 });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [paginating, setPaginating] = useState(false);
  const ITEMS_PER_PAGE = 30;

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
        width: stdout.columns || 80,
        height: stdout.rows || 24
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
        // Build the command string for display
        const commandArgs = [...claudeArgs, '--resume', selectedConv.sessionId];
        const commandStr = `claude ${commandArgs.join(' ')}`;
        
        // Show executing status
        setStatusMessage(`Executing: ${commandStr}`);
        
        // Small delay to show the message before clearing screen
        setTimeout(() => {
          console.log(`\nResuming conversation: ${selectedConv.sessionId}`);
          console.log(`Directory: ${selectedConv.projectPath}`);
          
          // Clear the screen and exit the app
          console.clear();
          exit();
          
          // Windows-specific reminder before Claude starts
          if (process.platform === 'win32') {
            console.log('💡 Reminder: If input doesn\'t work, press ENTER to activate.');
            console.log('');
          }
          
          // Spawn claude process (same for all platforms)
          // Use shell command string to avoid deprecation warning
          const claudeCommand = `claude ${commandArgs.join(' ')}`;
          const claude = spawn(claudeCommand, {
            stdio: 'inherit',
            cwd: selectedConv.projectPath,
            shell: true
          });
          
          claude.on('error', (err) => {
            console.error('\nFailed to resume conversation:', err.message);
            console.error('Make sure Claude Code is installed and available in PATH');
            console.error(`Or the project directory might not exist: ${selectedConv.projectPath}`);
            
            // Fallback: copy session ID to clipboard
            try {
              clipboardy.writeSync(selectedConv.sessionId);
              console.log(`\nSession ID copied to clipboard: ${selectedConv.sessionId}`);
              console.log(`Project directory: ${selectedConv.projectPath}`);
              console.log(`You can manually run:`);
              console.log(`  cd "${selectedConv.projectPath}"`);
              const argsStr = claudeArgs.length > 0 ? claudeArgs.join(' ') + ' ' : '';
              console.log(`  claude ${argsStr}--resume ${selectedConv.sessionId}`);
            } catch (clipErr) {
              console.error('Failed to copy to clipboard:', clipErr instanceof Error ? clipErr.message : String(clipErr));
            }
            
            process.exit(1);
          });
          
          claude.on('close', (code) => {
            process.exit(code || 0);
          });
        }, 500); // Show status message for 500ms before executing
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
          setTimeout(() => setStatusMessage(null), 2000);
        } catch {
          setStatusMessage('✗ Failed to copy to clipboard');
          setTimeout(() => setStatusMessage(null), 2000);
        }
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
  const headerHeight = 2; // Title + pagination info
  const listMaxHeight = 9; // Maximum height for conversation list
  const visibleConversations = Math.min(4, conversations.length); // Show max 4 conversations per page
  // List height calculation: 
  // 2 (borders) + 1 (title) + visibleConversations + 1 (more message if needed)
  const needsMoreIndicator = conversations.length > visibleConversations ? 1 : 0;
  const listHeight = Math.min(listMaxHeight, 3 + visibleConversations + needsMoreIndicator);
  // Add bottom margin (1 line) to prevent overflow
  const bottomMargin = 1;
  const previewHeight = Math.max(10, dimensions.height - headerHeight - listHeight - bottomMargin);

  return (
    <Box flexDirection="column" width={dimensions.width} height={dimensions.height} paddingX={1} paddingY={0}>
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