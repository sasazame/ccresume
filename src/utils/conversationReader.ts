import { readdir, readFile, stat } from 'fs/promises';
import { join, sep, basename } from 'path';
import { homedir } from 'os';
import type { Conversation, Message } from '../types.js';
import { extractMessageText } from './messageUtils.js';

const CLAUDE_PROJECTS_DIR = join(homedir(), '.claude', 'projects');

interface PaginationOptions {
  limit: number;
  offset: number;
  currentDirFilter?: string;
}



// Helper function to convert project path to Claude directory name
function pathToClaudeDir(path: string): string {
  // Claude's conversion: / or \ becomes -, and . also becomes -
  return path.replace(/[/\\.]/g, '-');
}

// Get paginated conversations with lazy loading
export async function getPaginatedConversations(options: PaginationOptions): Promise<{
  conversations: Conversation[];
  total: number;
}> {
  // First, just get file paths and stats without reading content
  const allFiles: Array<{path: string, dir: string, mtime: Date}> = [];
  
  try {
    const projectDirs = await readdir(CLAUDE_PROJECTS_DIR);
    
    // If filtering by directory, convert the filter path to Claude's directory name format
    const targetDir = options.currentDirFilter ? pathToClaudeDir(options.currentDirFilter) : null;
    
    for (const projectDir of projectDirs) {
      // Skip directories that don't match the filter early
      if (targetDir && projectDir !== targetDir) {
        continue;
      }
      
      const projectPath = join(CLAUDE_PROJECTS_DIR, projectDir);
      const dirFiles = await readdir(projectPath);
      const jsonlFiles = dirFiles.filter(f => f.endsWith('.jsonl') && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jsonl$/i.test(f));
      
      for (const file of jsonlFiles) {
        const filePath = join(projectPath, file);
        const stats = await stat(filePath);
        allFiles.push({
          path: filePath,
          dir: projectDir,
          mtime: stats.mtime
        });
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { conversations: [], total: 0 };
    }
    throw error;
  }
  
  // Sort by modification time (newest first)
  allFiles.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
  
  const conversations: Conversation[] = [];
  let skippedCount = 0;
  let fileIndex = 0;
  
  // Skip files based on offset
  while (skippedCount < options.offset && fileIndex < allFiles.length) {
    const file = allFiles[fileIndex];
    const conversation = await readConversation(file.path, file.dir);
    
    if (conversation) {
      skippedCount++;
    }
    fileIndex++;
  }
  
  // Collect conversations for the current page
  while (conversations.length < options.limit && fileIndex < allFiles.length) {
    const file = allFiles[fileIndex];
    const conversation = await readConversation(file.path, file.dir);
    
    if (conversation) {
      conversations.push(conversation);
    }
    fileIndex++;
  }
  
  // For total count, we'll return -1 to indicate unknown
  // The UI can handle this by not showing total pages
  return { conversations, total: -1 };
}

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
    
    const result = filteredConversations
      .sort((a, b) => b.endTime.getTime() - a.endTime.getTime());
    
    return result;
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
    
    // Extract session ID from filename
    const filename = basename(filePath);
    const filenameSessionId = filename.replace('.jsonl', '');
    
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
    
    const projectName = projectDir.replace(/^-/, '').split('-').join(sep);
    
    const startTime = new Date(messages[0].timestamp);
    const endTime = new Date(messages[messages.length - 1].timestamp);
    
    
    // Use session ID from filename as it's what Claude expects for --resume
    const sessionId = filenameSessionId;
    
    const projectPath = messages[0].cwd || '';
    
    // Get gitBranch from the last line of the jsonl file
    let gitBranch: string | null = null;
    try {
      const lastLine = lines[lines.length - 1];
      const lastData = JSON.parse(lastLine);
      if (lastData.gitBranch !== undefined) {
        gitBranch = lastData.gitBranch || '-';
      } else {
        gitBranch = '-';
      }
    } catch {
      gitBranch = '-';
    }
    
    return {
      sessionId,
      projectPath,
      projectName,
      gitBranch,
      messages,
      firstMessage: userMessages.length > 0 ? extractMessageText(userMessages[0].message?.content) : '',
      lastMessage: userMessages.length > 0 ? extractMessageText(userMessages[userMessages.length - 1].message?.content) : '',
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