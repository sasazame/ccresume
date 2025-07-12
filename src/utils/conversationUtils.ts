import type { Conversation } from '../types.js';
import { extractMessageText } from './messageUtils.js';

export function generateConversationSummary(conversation: Conversation): string {
  // Get user messages that have actual text content (not tool results)
  const userMessages = conversation.messages
    .filter(m => {
      if (m.type !== 'user') return false;
      if (!m.message?.content) return false;
      
      // Skip tool result messages
      const content = extractMessageText(m.message.content);
      if (content.startsWith('[Tool Result]') || content.startsWith('[Tool Output]')) {
        return false;
      }
      
      return content.trim().length > 0;
    });
  
  if (userMessages.length === 0) {
    return 'No user messages';
  }
  
  // Get the first meaningful user message (not the last)
  const firstUserMessage = userMessages[0];
  const messageText = extractMessageText(firstUserMessage.message?.content || '');
  
  // Clean up the message - remove ALL newlines, HTML tags, and normalize spaces
  const cleanedMessage = messageText
    .replace(/[\r\n]+/g, ' ')           // Replace all newlines with space
    .replace(/<[^>]*>/g, '')            // Remove HTML tags
    .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
    .replace(/[`'"]/g, '')              // Remove quotes that might break display
    .replace(/^\[.*?\]\s*/, '')         // Remove [Tool: xxx] prefixes
    .trim();
  
  // If message is empty after cleaning, try the next one
  if (!cleanedMessage && userMessages.length > 1) {
    const secondMessage = extractMessageText(userMessages[1].message?.content || '');
    return secondMessage
      .replace(/[\r\n]+/g, ' ')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[`'"]/g, '')
      .replace(/^\[.*?\]\s*/, '')
      .trim() || 'No summary available';
  }
  
  return cleanedMessage || 'No summary available';
}

export function formatProjectPath(path: string): string {
  // Shorten home directory path for both Unix and Windows
  const home = process.env.HOME || process.env.USERPROFILE || (process.platform === 'win32' ? 'C:\\Users\\Default' : '/home');
  if (path.startsWith(home)) {
    return '~' + path.slice(home.length);
  }
  return path;
}

export function formatSessionId(sessionId: string): string {
  // Show first 8 characters of session ID
  return sessionId ? sessionId.substring(0, 8) : 'unknown';
}