import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { ConversationList } from './components/ConversationList.js';
import { ConversationPreview } from './components/ConversationPreview.js';
import { getAllConversations } from './utils/conversationReader.js';
import { spawn } from 'child_process';
import clipboardy from 'clipboardy';
import type { Conversation } from './types.js';

interface AppProps {
  claudeArgs?: string[];
}

const App: React.FC<AppProps> = ({ claudeArgs = [] }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 80, height: 24 });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

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

  const loadConversations = async () => {
    try {
      setLoading(true);
      const convs = await getAllConversations();
      setConversations(convs);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
      setLoading(false);
    }
  };

  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }

    if (loading || conversations.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(conversations.length - 1, prev + 1));
    }
    

    if (key.return) {
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
          
          // Spawn claude process in the project directory with passed arguments
          const claude = spawn('claude', commandArgs, {
            stdio: 'inherit',
            cwd: selectedConv.projectPath,  // This sets the working directory for the child process
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
            // The parent process directory remains unchanged
            process.exit(code || 0);
          });
        }, 500); // Show status message for 500ms before executing
      }
    }

    if (input === 'c') {
      // Copy session ID to clipboard
      const selectedConv = conversations[selectedIndex];
      if (selectedConv) {
        try {
          clipboardy.writeSync(selectedConv.sessionId);
          // Show temporary status message
          setStatusMessage('✓ Session ID copied to clipboard!');
          setTimeout(() => setStatusMessage(null), 2000);
        } catch (err) {
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

  const selectedConversation = conversations[selectedIndex] || null;
  
  // Calculate heights for fixed layout
  const headerHeight = 1; // Title only
  const listMaxHeight = 9; // Maximum height for conversation list
  const visibleConversations = Math.min(4, conversations.length); // Show max 4 conversations
  // List height calculation: 
  // 2 (borders) + 1 (title) + visibleConversations + 1 (more message if needed)
  const needsMoreIndicator = conversations.length > visibleConversations ? 1 : 0;
  const listHeight = Math.min(listMaxHeight, 3 + visibleConversations + needsMoreIndicator);
  // Add bottom margin (1 line) to prevent overflow
  const bottomMargin = 1;
  const previewHeight = Math.max(10, dimensions.height - headerHeight - listHeight - bottomMargin);

  return (
    <Box flexDirection="column" width={dimensions.width} height={dimensions.height} paddingX={1} paddingY={0}>
      <Box height={headerHeight}>
        <Text bold color="cyan">ccresume - Claude Code Conversation Browser</Text>
      </Box>
      
      <Box height={listHeight}>
        <ConversationList 
          conversations={conversations} 
          selectedIndex={selectedIndex}
          maxVisible={visibleConversations}
        />
      </Box>
      
      <Box height={previewHeight}>
        <ConversationPreview conversation={selectedConversation} statusMessage={statusMessage} />
      </Box>
      
      {/* Bottom margin to absorb any overflow */}
      <Box height={bottomMargin} />
    </Box>
  );
};

export default App;