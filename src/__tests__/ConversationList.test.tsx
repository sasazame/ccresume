import React from 'react';
import { render } from 'ink-testing-library';
import { ConversationList } from '../components/ConversationList.js';
import type { Conversation } from '../types.js';

describe('ConversationList', () => {
  const mockConversation: Conversation = {
    sessionId: '12345678-1234-1234-1234-123456789012',
    projectPath: '/home/user/project',
    projectName: 'test-project',
    messages: [
      {
        type: 'user',
        message: {
          role: 'user',
          content: 'Test message'
        },
        timestamp: '2024-01-01T12:00:00Z',
        sessionId: '12345678-1234-1234-1234-123456789012',
        cwd: '/home/user/project'
      }
    ],
    firstMessage: 'Test message',
    lastMessage: 'Test message',
    startTime: new Date('2024-01-01T12:00:00Z'),
    endTime: new Date('2024-01-01T12:30:00Z')
  };

  it('renders empty state when no conversations', () => {
    const { lastFrame } = render(
      <ConversationList conversations={[]} selectedIndex={0} />
    );
    
    expect(lastFrame()).toContain('No conversations found');
  });

  it('renders conversation list correctly', () => {
    const { lastFrame } = render(
      <ConversationList 
        conversations={[mockConversation]} 
        selectedIndex={0} 
      />
    );
    
    expect(lastFrame()).toContain('Select a conversation (1 shown):');
    // Session ID is no longer displayed in the list
    expect(lastFrame()).not.toContain('[12345678]');
    expect(lastFrame()).toContain('/home/user/project'); // Full project path (shortening only works for actual home directory)
    expect(lastFrame()).toContain('Test message'); // Summary
  });

  it('shows selected conversation with indicator', () => {
    const conversations = [
      mockConversation,
      { ...mockConversation, sessionId: '87654321-1234-1234-1234-123456789012' }
    ];
    
    const { lastFrame } = render(
      <ConversationList 
        conversations={conversations} 
        selectedIndex={1} 
      />
    );
    
    // Selected indicator is shown, but without session ID
    const output = lastFrame();
    expect(output).toMatch(/▶.*\/home\/user\/project/); // Selected indicator with path
  });

  it('shows more indicator when conversations exceed maxVisible', () => {
    const conversations = Array.from({ length: 10 }, (_, i) => ({
      ...mockConversation,
      sessionId: `session-${i}`
    }));
    
    const { lastFrame } = render(
      <ConversationList 
        conversations={conversations} 
        selectedIndex={0}
        maxVisible={3}
      />
    );
    
    expect(lastFrame()).toContain('↓ 7 more on this page...');
  });
});