import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { format } from 'date-fns';
import type { Conversation } from '../types.js';
import { generateConversationSummary, formatProjectPath } from '../utils/conversationUtils.js';
import { getStringDisplayLength } from '../utils/stringUtils.js';
import { strictTruncateByWidth } from '../utils/strictTruncate.js';

interface ConversationListProps {
  conversations: Conversation[];
  selectedIndex: number;
  maxVisible?: number;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  conversations, 
  selectedIndex,
  maxVisible = 3,
  isLoading = false
}) => {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 80;
  
  // Calculate visible range with bounds checking
  const safeSelectedIndex = Math.max(0, Math.min(selectedIndex, conversations.length - 1));
  
  // Calculate scroll window
  let startIndex = 0;
  let endIndex = conversations.length;
  
  if (conversations.length > maxVisible) {
    const halfWindow = Math.floor(maxVisible / 2);
    startIndex = Math.max(0, safeSelectedIndex - halfWindow);
    endIndex = Math.min(conversations.length, startIndex + maxVisible);
    
    // Adjust if we're at the end
    if (endIndex === conversations.length) {
      startIndex = Math.max(0, endIndex - maxVisible);
    }
  }
  
  const visibleConversations = conversations.slice(startIndex, endIndex);
  const hasMoreBelow = endIndex < conversations.length;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" paddingX={1} width="100%" overflow="hidden">
      <Text bold color="cyan">{isLoading ? 'Loading conversations...' : `Select a conversation${conversations.length > 0 ? ` (${conversations.length} shown)` : ''}:`}</Text>
      
      {isLoading ? (
        <Box flexDirection="column" height={maxVisible}>
        </Box>
      ) : conversations.length === 0 ? (
        <Text color="gray">No conversations found</Text>
      ) : (
        visibleConversations.map((conv, visibleIndex) => {
          const actualIndex = startIndex + visibleIndex;
          const isSelected = actualIndex === safeSelectedIndex;
          
          const summary = generateConversationSummary(conv);
          const projectPath = formatProjectPath(conv.projectPath);
          
          // Calculate the fixed part length
          const selector = isSelected ? '▶ ' : '  ';
          const dateStr = format(conv.endTime, 'MMM dd HH:mm');
          const fixedPart = `${selector}${dateStr} | ${projectPath}`;
          const fixedPartLength = getStringDisplayLength(fixedPart);
          
          // Calculate available space for summary (with separator)
          // Add extra buffer to prevent overflow: borders(2) + padding(2) + selector(2) + safety(10) = 16
          const separator = ' | ';
          const totalMargin = 16;
          const availableSpace = Math.max(20, terminalWidth - fixedPartLength - separator.length - totalMargin);
          const truncatedSummary = strictTruncateByWidth(summary, availableSpace);
          
          // Combine everything into one line
          const fullLine = truncatedSummary 
            ? `${fixedPart}${separator}${truncatedSummary}`
            : fixedPart;
            
          // Final safety check: ensure the entire line fits
          const maxLineWidth = terminalWidth - totalMargin;
          const safeLine = strictTruncateByWidth(fullLine, maxLineWidth);
          
          return (
            <Box key={conv.sessionId} width="100%" overflow="hidden">
              <Text
                color={isSelected ? 'black' : 'white'}
                backgroundColor={isSelected ? 'cyan' : undefined}
                bold={isSelected}
              >
                {safeLine}
              </Text>
            </Box>
          );
        })
      )}
      
      {hasMoreBelow && (
        <Box width="100%">
          <Text color="cyan">↓ {conversations.length - endIndex} more on this page...</Text>
        </Box>
      )}
    </Box>
  );
};