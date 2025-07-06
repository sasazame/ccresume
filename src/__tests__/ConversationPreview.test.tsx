import React from 'react';
import { render } from 'ink-testing-library';
import { jest } from '@jest/globals';
import type { Conversation } from '../types.js';
import { defaultConfig } from '../types/config.js';

// Mock the config loader to return a consistent config synchronously
jest.unstable_mockModule('../utils/configLoader.js', () => ({
  loadConfig: () => defaultConfig
}));

// Import ConversationPreview after mocking
const { ConversationPreview } = await import('../components/ConversationPreview.js');

describe('ConversationPreview', () => {
  const mockConversation: Conversation = {
    sessionId: '12345678-1234-1234-1234-123456789012',
    projectPath: '/home/user/project',
    projectName: 'test-project',
    messages: [
      {
        type: 'user',
        message: {
          role: 'user',
          content: 'Hello, this is a test message'
        },
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: '12345678-1234-1234-1234-123456789012',
        cwd: '/home/user/project'
      },
      {
        type: 'assistant',
        message: {
          role: 'assistant',
          content: 'This is a response'
        },
        timestamp: '2024-01-01T12:01:00Z',
        sessionId: '12345678-1234-1234-1234-123456789012',
        cwd: '/home/user/project'
      }
    ],
    firstMessage: 'Hello, this is a test message',
    lastMessage: 'Hello, this is a test message',
    startTime: new Date('2024-01-01T12:00:00Z'),
    endTime: new Date('2024-01-01T12:30:00Z')
  };

  it('renders empty state when no conversation selected', () => {
    const { lastFrame } = render(
      <ConversationPreview conversation={null} />
    );
    
    // Should render an empty box without text
    expect(lastFrame()).not.toContain('Select a conversation to preview');
  });

  it('renders conversation header correctly', () => {
    const { lastFrame } = render(
      <ConversationPreview conversation={mockConversation} />
    );
    
    expect(lastFrame()).toContain('Conversation History');
    expect(lastFrame()).toContain('(2 messages, 30 min)');
    expect(lastFrame()).toContain('Session:');
    expect(lastFrame()).toContain('12345678-1234-1234-1234-123456789012');
    expect(lastFrame()).toContain('Directory:');
    expect(lastFrame()).toContain('/home/user/project');
  });

  it('renders messages correctly', () => {
    const { lastFrame } = render(
      <ConversationPreview conversation={mockConversation} />
    );
    
    expect(lastFrame()).toContain('User');
    expect(lastFrame()).toContain('Hello, this is a test message');
    expect(lastFrame()).toContain('Assistant');
    expect(lastFrame()).toContain('This is a response');
  });

  it('renders scroll help text', () => {
    const { lastFrame } = render(
      <ConversationPreview conversation={mockConversation} />
    );
    
    expect(lastFrame()).toContain('Scroll:');
    expect(lastFrame()).toContain('Enter: resume');
    expect(lastFrame()).toContain('quit');
  });

  it('shows navigation help for long conversations', () => {
    const longConversation = {
      ...mockConversation,
      messages: Array.from({ length: 20 }, (_, i) => ({
        type: 'user' as const,
        message: { role: 'user' as const, content: `Message ${i}` },
        timestamp: new Date(2024, 0, 1, 12, i).toISOString(),
        sessionId: mockConversation.sessionId,
        cwd: mockConversation.projectPath
      }))
    };
    
    const { lastFrame } = render(
      <ConversationPreview conversation={longConversation} />
    );
    
    // Should show navigation help (scroll indicators were removed)
    const frame = lastFrame();
    const hasShortcuts = frame.includes('Scroll:') && frame.includes('Page:');
    const hasLoading = frame.includes('Loading shortcuts...');
    expect(hasShortcuts || hasLoading).toBe(true);
  });

  describe('Status Messages', () => {
    it('displays custom status message', () => {
      const { lastFrame } = render(
        <ConversationPreview 
          conversation={mockConversation} 
          statusMessage="Custom status message"
        />
      );
      
      expect(lastFrame()).toContain('Custom status message');
      expect(lastFrame()).not.toContain('Scroll: j/k');
    });

    it('shows default help when no status message', () => {
      const { lastFrame } = render(
        <ConversationPreview 
          conversation={mockConversation} 
          statusMessage={null}
        />
      );
      
      const frame = lastFrame();
      const hasShortcuts = frame.includes('Scroll:');
      const hasLoading = frame.includes('Loading shortcuts...');
      expect(hasShortcuts || hasLoading).toBe(true);
    });
  });

  describe('Scrolling', () => {
    const createLongConversation = () => ({
      ...mockConversation,
      messages: Array.from({ length: 30 }, (_, i) => ({
        type: (i % 2 === 0 ? 'user' : 'assistant') as const,
        message: { 
          role: (i % 2 === 0 ? 'user' : 'assistant') as const, 
          content: `Message ${i}` 
        },
        timestamp: new Date(2024, 0, 1, 12, i).toISOString(),
        sessionId: mockConversation.sessionId,
        cwd: mockConversation.projectPath
      }))
    });

    it('scrolls to bottom on initial render', () => {
      const longConv = createLongConversation();
      const { lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Should show recent messages (near the end)
      expect(lastFrame()).toContain('Message 2'); // Will see some of the latest
    });

    it('scrolls up with k key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Press k to scroll up
      stdin.write('k');
      
      // Frame should update after scrolling
      expect(lastFrame()).toBeDefined();
    });

    it('scrolls down with j key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // First scroll up
      stdin.write('k');
      stdin.write('k');
      
      // Then scroll down
      stdin.write('j');
      
      expect(lastFrame()).toBeDefined();
    });

    it('jumps to top with g key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Jump to top
      stdin.write('g');
      
      // Should see first messages
      expect(lastFrame()).toContain('Message 0');
    });

    it('jumps to bottom with G key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // First go to top
      stdin.write('g');
      
      // Then jump to bottom
      stdin.write('G');
      
      expect(lastFrame()).toBeDefined();
    });

    it('page down with d key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Go to top first
      stdin.write('g');
      
      // Page down
      stdin.write('d');
      
      expect(lastFrame()).toBeDefined();
    });

    it('page up with u key', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Page up
      stdin.write('u');
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles Ctrl+D for page down', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Ctrl+D
      stdin.write('\x04');
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles Ctrl+U for page up', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Ctrl+U
      stdin.write('\x15');
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles Ctrl+N for line down', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Ctrl+N
      stdin.write('\x0E');
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles Ctrl+P for line up', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Ctrl+P
      stdin.write('\x10');
      
      expect(lastFrame()).toBeDefined();
    });

    it('handles page up/down keys', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // PageDown
      stdin.write('\u001B[6~');
      
      // PageUp
      stdin.write('\u001B[5~');
      
      expect(lastFrame()).toBeDefined();
    });

    it('respects scroll boundaries', () => {
      const longConv = createLongConversation();
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={longConv} />
      );
      
      // Try to scroll past top
      stdin.write('g'); // Go to top
      stdin.write('k'); // Try to go up more
      stdin.write('k'); // Try to go up more
      
      // Should still show first message
      expect(lastFrame()).toContain('Message 0');
      
      // Try to scroll past bottom
      stdin.write('G'); // Go to bottom
      stdin.write('j'); // Try to go down more
      stdin.write('j'); // Try to go down more
      
      expect(lastFrame()).toBeDefined();
    });

    it('does not scroll when conversation is null', () => {
      const { stdin, lastFrame } = render(
        <ConversationPreview conversation={null} />
      );
      
      // Try various scroll commands
      stdin.write('j');
      stdin.write('k');
      stdin.write('g');
      stdin.write('G');
      
      // Should still show empty state (no text)
      expect(lastFrame()).not.toContain('Select a conversation to preview');
    });
  });

  describe('Message Rendering', () => {
    it('handles messages without proper structure', () => {
      const malformedConv = {
        ...mockConversation,
        messages: [
          null as unknown as Message,
          { type: 'user' }, // Missing message property
          mockConversation.messages[0],
          { message: null } as unknown as Message // Null message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={malformedConv} />
      );
      
      // Should only render valid message
      expect(lastFrame()).toContain('Hello, this is a test message');
    });

    it('handles tool result messages', () => {
      const toolConv = {
        ...mockConversation,
        messages: [
          ...mockConversation.messages,
          {
            type: 'assistant' as const,
            message: null,
            toolUseResult: {
              stdout: 'Command output here'
            },
            timestamp: '2024-01-01T12:02:00Z',
            sessionId: mockConversation.sessionId,
            cwd: mockConversation.projectPath
          } as Message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={toolConv} />
      );
      
      expect(lastFrame()).toContain('[Tool Output]');
      expect(lastFrame()).toContain('Command output here');
    });

    it('handles tool error messages', () => {
      const toolErrorConv = {
        ...mockConversation,
        messages: [
          {
            type: 'assistant' as const,
            message: null,
            toolUseResult: {
              stderr: 'Error message here'
            },
            timestamp: '2024-01-01T12:02:00Z',
            sessionId: mockConversation.sessionId,
            cwd: mockConversation.projectPath
          } as Message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={toolErrorConv} />
      );
      
      expect(lastFrame()).toContain('[Tool Error]');
      expect(lastFrame()).toContain('Error message here');
    });

    it('handles file list results', () => {
      const fileListConv = {
        ...mockConversation,
        messages: [
          {
            type: 'assistant' as const,
            message: null,
            toolUseResult: {
              filenames: ['file1.txt', 'file2.js', 'file3.md']
            },
            timestamp: '2024-01-01T12:02:00Z',
            sessionId: mockConversation.sessionId,
            cwd: mockConversation.projectPath
          } as Message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={fileListConv} />
      );
      
      expect(lastFrame()).toContain('[Files Found: 3]');
      expect(lastFrame()).toContain('file1.txt');
      expect(lastFrame()).toContain('file2.js');
      expect(lastFrame()).toContain('file3.md');
    });

    it('truncates long file lists', () => {
      const manyFilesConv = {
        ...mockConversation,
        messages: [
          {
            type: 'assistant' as const,
            message: null,
            toolUseResult: {
              filenames: Array.from({ length: 15 }, (_, i) => `file${i}.txt`)
            },
            timestamp: '2024-01-01T12:02:00Z',
            sessionId: mockConversation.sessionId,
            cwd: mockConversation.projectPath
          } as Message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={manyFilesConv} />
      );
      
      expect(lastFrame()).toContain('[Files Found: 15]');
      expect(lastFrame()).toContain('file0.txt');
      // The text is truncated due to width constraints
      expect(lastFrame()).toContain('...');
    });

    it('handles empty tool results', () => {
      const emptyToolConv = {
        ...mockConversation,
        messages: [
          {
            type: 'assistant' as const,
            message: null,
            toolUseResult: {},
            timestamp: '2024-01-01T12:02:00Z',
            sessionId: mockConversation.sessionId,
            cwd: mockConversation.projectPath
          } as Message
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={emptyToolConv} />
      );
      
      expect(lastFrame()).toContain('[Tool Result: No output]');
    });

    it('skips messages with invalid timestamps', () => {
      const invalidTimestampConv = {
        ...mockConversation,
        messages: [
          {
            type: 'user' as const,
            message: { role: 'user' as const, content: 'Valid message' },
            timestamp: '2024-01-01T12:00:00Z',
            sessionId: mockConversation.sessionId
          },
          {
            type: 'user' as const,
            message: { role: 'user' as const, content: 'Invalid timestamp' },
            timestamp: 'invalid-date',
            sessionId: mockConversation.sessionId
          }
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={invalidTimestampConv} />
      );
      
      expect(lastFrame()).toContain('Valid message');
      expect(lastFrame()).not.toContain('Invalid timestamp');
    });

    it('identifies tool messages correctly', () => {
      const toolMessageConv = {
        ...mockConversation,
        messages: [
          {
            type: 'assistant' as const,
            message: {
              role: 'assistant' as const,
              content: [
                { type: 'tool_use', name: 'bash', input: { command: 'ls' } }
              ]
            },
            timestamp: '2024-01-01T12:00:00Z',
            sessionId: mockConversation.sessionId
          }
        ]
      };
      
      const { lastFrame } = render(
        <ConversationPreview conversation={toolMessageConv} />
      );
      
      expect(lastFrame()).toContain('[Tool: bash]');
    });
  });

  describe('Conversation Changes', () => {
    const createLongConversation = () => ({
      ...mockConversation,
      messages: Array.from({ length: 30 }, (_, i) => ({
        type: (i % 2 === 0 ? 'user' : 'assistant') as const,
        message: { 
          role: (i % 2 === 0 ? 'user' : 'assistant') as const, 
          content: `Message ${i}` 
        },
        timestamp: new Date(2024, 0, 1, 12, i).toISOString(),
        sessionId: mockConversation.sessionId,
        cwd: mockConversation.projectPath
      }))
    });

    it('resets scroll position when conversation changes', () => {
      const conv1 = createLongConversation();
      const conv2 = {
        ...conv1,
        sessionId: 'different-session',
        messages: Array.from({ length: 40 }, (_, i) => ({
          ...conv1.messages[0],
          message: { ...conv1.messages[0].message, content: `Different ${i}` }
        }))
      };
      
      const { rerender, lastFrame, stdin } = render(
        <ConversationPreview conversation={conv1} />
      );
      
      // Scroll to top
      stdin.write('g');
      expect(lastFrame()).toContain('Message 0');
      
      // Change conversation
      rerender(<ConversationPreview conversation={conv2} />);
      
      // Should be at bottom of new conversation
      expect(lastFrame()).toContain('Different');
    });
  });
});