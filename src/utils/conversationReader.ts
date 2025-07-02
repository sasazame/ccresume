import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import type { Conversation, Message } from '../types.js';
import { extractMessageText } from './messageUtils.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

export async function getAllConversations(currentDirFilter?: string): Promise<Conversation[]> {
  const conversations: Conversation[] = [];
  
  try {
    const projectDirs = await readdir(CLAUDE_PROJECTS_DIR);
    
    for (const projectDir of projectDirs) {
      const projectPath = join(CLAUDE_PROJECTS_DIR, projectDir);
      const files = await readdir(projectPath);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
      
      for (const file of jsonlFiles) {
        const filePath = join(projectPath, file);
        const conversation = await readConversation(filePath, projectDir);
        if (conversation) {
          conversations.push(conversation);
        }
      }
    }
    
    // Filter by current directory if specified
    let filteredConversations = conversations;
    if (currentDirFilter) {
      filteredConversations = conversations.filter(conv => 
        conv.projectPath === currentDirFilter
      );
    }
    
    // Remove duplicates based on sessionId
    const uniqueConversations = new Map<string, Conversation>();
    for (const conv of filteredConversations) {
      const existing = uniqueConversations.get(conv.sessionId);
      if (!existing || conv.endTime > existing.endTime) {
        uniqueConversations.set(conv.sessionId, conv);
      }
    }
    
    return Array.from(uniqueConversations.values())
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function readConversation(filePath: string, projectDir: string): Promise<Conversation | null> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return null;
    }
    
    const messages: Message[] = [];
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        // Only include messages with proper structure
        // Skip user messages that are tool results
        if (data && data.type && data.message && data.timestamp) {
          // Check if it's a user message with tool_result content
          if (data.type === 'user' && 
              data.message.content && 
              Array.isArray(data.message.content) && 
              data.message.content.length > 0 &&
              data.message.content[0].type === 'tool_result') {
            // Skip tool result messages from user
            continue;
          }
          messages.push(data as Message);
        }
      } catch {
        continue;
      }
    }
    
    if (messages.length === 0) {
      return null;
    }
    
    const userMessages = messages.filter(m => m.type === 'user');
    if (userMessages.length === 0) {
      return null;
    }
    
    const projectName = projectDir.replace(/^-/, '').split('-').join('/');
    
    const startTime = new Date(messages[0].timestamp);
    const endTime = new Date(messages[messages.length - 1].timestamp);
    
    // Skip conversations with invalid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return null;
    }
    
    // Find a valid session ID from messages (use the last one found)
    let sessionId = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.sessionId && msg.sessionId !== 'undefined') {
        sessionId = msg.sessionId;
        break;
      }
    }
    
    // Skip if no valid session ID found
    if (!sessionId) {
      return null;
    }
    
    return {
      sessionId,
      projectPath: messages[0].cwd || '',
      projectName,
      messages,
      firstMessage: extractMessageText(userMessages[0].message?.content),
      lastMessage: extractMessageText(userMessages[userMessages.length - 1].message?.content),
      startTime,
      endTime
    };
  } catch (error) {
    console.error(`Error reading conversation file ${filePath}:`, error);
    return null;
  }
}

export function formatConversationSummary(conversation: Conversation): string {
  const firstMessagePreview = conversation.firstMessage
    .replace(/\n/g, ' ')
    .substring(0, 80)
    .trim();
    
  return `${firstMessagePreview}${conversation.firstMessage.length > 80 ? '...' : ''}`;
}