import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { format } from 'date-fns';
import type { Conversation } from '../types.js';
import { extractMessageText } from '../utils/messageUtils.js';

interface ConversationPreviewFullProps {
  conversation: Conversation | null;
  statusMessage?: string | null;
  hideOptions?: string[];
}

export const ConversationPreviewFull: React.FC<ConversationPreviewFullProps> = ({ conversation, statusMessage, hideOptions = [] }) => {
  const [scrollOffset, setScrollOffset] = useState(0);

  // Filter messages based on hideOptions
  const filteredMessages = conversation ? conversation.messages.filter(msg => {
    if (!msg || (!msg.message && !msg.toolUseResult)) {
      return false;
    }
    
    // Get content to check message type
    let content = '';
    if (msg.message && msg.message.content) {
      content = extractMessageText(msg.message.content);
    } else if (msg.toolUseResult) {
      // Tool result messages are considered tool messages
      return !hideOptions.includes('tool');
    }
    
    // Check if this is a tool message
    if (hideOptions.includes('tool') && content.startsWith('[Tool:')) {
      return false;
    }
    
    // Check if this is a thinking message
    if (hideOptions.includes('thinking') && content === '[Thinking...]') {
      return false;
    }
    
    // Check if we should hide user messages
    if (hideOptions.includes('user') && msg.type === 'user') {
      return false;
    }
    
    // Check if we should hide assistant messages
    if (hideOptions.includes('assistant') && msg.type === 'assistant') {
      return false;
    }
    
    return true;
  }) : [];

  useEffect(() => {
    // When conversation changes, scroll to the bottom (most recent messages)
    if (conversation) {
      // Just scroll to the end
      setScrollOffset(Math.max(0, filteredMessages.length - 1));
    } else {
      setScrollOffset(0);
    }
  }, [conversation?.sessionId, filteredMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disable all keyboard navigation in full view - only mouse scroll works
  useInput(() => {
    // Do nothing - keyboard navigation is disabled in full view
  });

  if (!conversation) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color="gray">No conversation selected</Text>
      </Box>
    );
  }

  // Show all messages from scroll offset onwards, let terminal handle overflow
  const visibleMessages = filteredMessages.slice(scrollOffset);

  return (
    <Box flexDirection="column">
      {visibleMessages.map((msg, index) => {
          // Skip messages without proper structure
          if (!msg || (!msg.message && !msg.toolUseResult)) {
            return null;
          }
          
          const isUser = msg.type === 'user';
          let content = '';
          
          // Handle different message formats
          if (msg.message && msg.message.content) {
            // Check if content contains tool_use
            const messageContent = msg.message.content;
            if (Array.isArray(messageContent)) {
              // Collect all content parts
              const contentParts: string[] = [];
              
              // Check for thinking content
              const thinkingItem = messageContent.find((item: any) => item.type === 'thinking');
              if (thinkingItem && thinkingItem.thinking) {
                contentParts.push(`[Thinking...]\n${thinkingItem.thinking.trim()}`);
              }
              
              // Check for regular text content
              const textItems = messageContent.filter((item: any) => item.type === 'text');
              textItems.forEach((item: any) => {
                if (item.text) {
                  contentParts.push(item.text);
                }
              });
              
              // Check for tool use
              const toolUse = messageContent.find((item: any) => item.type === 'tool_use');
              if (toolUse) {
                // Format tool use based on tool name
                if (toolUse.name === 'TodoWrite') {
                  const input = toolUse.input as any;
                  if (input?.todos) {
                    const todos = input.todos;
                    const todoSummary = todos.map((todo: any) => 
                      `  ${todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '→' : '○'} ${todo.content}`
                    ).join('\n');
                    contentParts.push(`[Tool: TodoWrite]\n${todoSummary}`);
                  } else {
                    contentParts.push(`[Tool: TodoWrite]`);
                  }
                } else if (toolUse.name === 'Edit') {
                  const input = toolUse.input as any;
                  const filePath = input?.filePath || input?.file_path || 'file';
                  const oldStr = input?.oldString || input?.old_string || '';
                  const newStr = input?.newString || input?.new_string || '';
                  contentParts.push(`[Tool: Edit] ${filePath}\nOld:\n${oldStr}\nNew:\n${newStr}`);
                } else if (toolUse.name === 'Read') {
                  const input = toolUse.input as any;
                  const filePath = input?.filePath || input?.file_path || 'file';
                  const lineInfo = input?.offset ? ` (lines ${input.offset}-${input.offset + (input.limit || 50)})` : '';
                  contentParts.push(`[Tool: Read] ${filePath}${lineInfo}`);
                } else if (toolUse.name === 'Bash') {
                  const input = toolUse.input as any;
                  contentParts.push(`[Tool: Bash] ${input?.command || input?.cmd || ''}`);
                } else if (toolUse.name === 'Grep') {
                  const input = toolUse.input as any;
                  contentParts.push(`[Tool: Grep] pattern: "${input?.pattern || ''}" in ${input?.glob || input?.path || '.'}`);
                } else if (toolUse.name === 'Glob') {
                  const input = toolUse.input as any;
                  contentParts.push(`[Tool: Glob] pattern: "${input?.pattern || ''}"`);
                } else if (toolUse.name === 'MultiEdit') {
                  const input = toolUse.input as any;
                  const filePath = input?.filePath || input?.file_path || 'file';
                  const edits = input?.edits || [];
                  const editSummary = edits.map((edit: any, i: number) => 
                    `Edit ${i + 1}:\nOld:\n${edit.oldString || edit.old_string || ''}\nNew:\n${edit.newString || edit.new_string || ''}`
                  ).join('\n\n');
                  contentParts.push(`[Tool: MultiEdit] ${filePath}\n${editSummary}`);
                } else {
                  contentParts.push(`[Tool: ${toolUse.name}] ${JSON.stringify(toolUse.input || {}).substring(0, 100)}...`);
                }
              }
              
              // Join all content parts
              content = contentParts.join('\n\n');
              if (!content) {
                content = extractMessageText(messageContent);
              }
            } else {
              content = extractMessageText(messageContent);
            }
          } else if (msg.toolUseResult) {
            // Handle tool result messages
            const result = msg.toolUseResult;
            if (result.oldTodos && result.newTodos) {
              // TodoWrite result
              const changes = result.newTodos.filter((newTodo: any) => {
                const oldTodo = result.oldTodos?.find((old: any) => old.id === newTodo.id);
                return !oldTodo || oldTodo.status !== newTodo.status || oldTodo.content !== newTodo.content;
              });
              content = `[TodoWrite Result] ${changes.length} todos updated`;
            } else if (result.file || result.filePath) {
              // Read result
              const filePath = result.file?.filePath || result.filePath;
              content = `[Read Result] ${filePath} (${result.file?.numLines || result.numLines || 0} lines)`;
            } else if (result.oldString && result.newString) {
              // Edit result
              content = `[Edit Result] ${result.filePath || 'file'} modified`;
            } else if (result.stdout) {
              content = `[Bash Output]\n${result.stdout.trim()}`;
            } else if (result.stderr) {
              content = `[Bash Error]\n${result.stderr.trim()}`;
            } else if (result.filenames && Array.isArray(result.filenames)) {
              const fileList = result.filenames.slice(0, 5).join('\n  ');
              const moreCount = result.filenames.length > 5 ? `\n  ... and ${result.filenames.length - 5} more` : '';
              content = `[Search Results: ${result.filenames.length} files]\n  ${fileList}${moreCount}`;
            } else {
              content = `[Tool Result] ${JSON.stringify(result).substring(0, 100)}...`;
            }
          }
          
          const timestamp = new Date(msg.timestamp);
          
          // Skip if timestamp is invalid
          if (isNaN(timestamp.getTime())) {
            return null;
          }
          
          
          const roleText = isUser ? 'User' : 'Assistant';
          const timeText = format(timestamp, 'HH:mm:ss');
          
          // Use a combination of timestamp and index for unique key
          const uniqueKey = `${msg.timestamp}-${scrollOffset + index}`;
          
          return (
            <Box key={uniqueKey} flexDirection="column">
              <Text>
                <Text color={isUser ? 'cyan' : 'green'} bold>[{roleText}]</Text>
                <Text dimColor> ({timeText})</Text>
              </Text>
              {content.split('\n').map((line, lineIndex) => {
                // Check if this line is a label (starts with [ and contains ])
                const isLabel = line.startsWith('[') && line.includes(']');
                
                if (isLabel) {
                  const labelMatch = line.match(/^(\[.*?\])(.*)/);
                  if (labelMatch) {
                    return (
                      <Text key={`${uniqueKey}-${lineIndex}`}>
                        {'  '}
                        <Text color="yellow">{labelMatch[1]}</Text>
                        <Text>{labelMatch[2]}</Text>
                      </Text>
                    );
                  }
                }
                
                return (
                  <Text key={`${uniqueKey}-${lineIndex}`}>
                    {'  '}
                    <Text>{line}</Text>
                  </Text>
                );
              })}
              <Text> </Text>
            </Box>
          );
        }).filter(Boolean)}
      
      <Text>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
      {statusMessage ? (
        <Text color="green" bold>{statusMessage}</Text>
      ) : (
        <Text dimColor>
          Toggle: f | Quit: q | Currently supports only terminal scroll (use your mouse!)
        </Text>
      )}
    </Box>
  );
};