import React from 'react';
import { render } from 'ink-testing-library';
import { ConversationPreviewFull } from '../components/ConversationPreviewFull.js';
import type { Conversation } from '../types.js';

describe('ConversationPreviewFull', () => {
  const mockConversation: Conversation = {
    sessionId: 'test-session-123',
    projectPath: '/test/project',
    projectName: 'test-project',
    gitBranch: 'main',
    messages: [
      {
        sessionId: 'test-session-123',
        timestamp: '2024-01-01T12:00:00Z',
        type: 'user',
        message: {
          role: 'user',
          content: 'Hello world'
        },
        cwd: '/test/project'
      },
      {
        sessionId: 'test-session-123',
        timestamp: '2024-01-01T12:00:01Z',
        type: 'assistant',
        message: {
          role: 'assistant',
          content: 'Hi there!'
        },
        cwd: '/test/project'
      }
    ],
    firstMessage: 'Hello world',
    lastMessage: 'Hi there!',
    startTime: new Date('2024-01-01T12:00:00Z'),
    endTime: new Date('2024-01-01T12:00:01Z')
  };

  it('should render without conversation', () => {
    const { lastFrame } = render(
      <ConversationPreviewFull conversation={null} />
    );
    
    expect(lastFrame()).toContain('No conversation selected');
  });

  it('should render conversation messages', () => {
    const { lastFrame } = render(
      <ConversationPreviewFull conversation={mockConversation} />
    );
    
    const output = lastFrame();
    expect(output).toContain('[User]');
    expect(output).toContain('Hello world');
    expect(output).toContain('[Assistant]');
    expect(output).toContain('Hi there!');
  });

  it('should show status message when provided', () => {
    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={mockConversation} 
        statusMessage="Test status"
      />
    );
    
    expect(lastFrame()).toContain('Test status');
  });

  it('should hide user messages when hideOptions includes user', () => {
    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={mockConversation} 
        hideOptions={['user']}
      />
    );
    
    const output = lastFrame();
    expect(output).not.toContain('[User]');
    expect(output).not.toContain('Hello world');
    expect(output).toContain('[Assistant]');
    expect(output).toContain('Hi there!');
  });

  it('should hide assistant messages when hideOptions includes assistant', () => {
    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={mockConversation} 
        hideOptions={['assistant']}
      />
    );
    
    const output = lastFrame();
    expect(output).toContain('[User]');
    expect(output).toContain('Hello world');
    expect(output).not.toContain('[Assistant]');
    expect(output).not.toContain('Hi there!');
  });

  it('should display tool use messages correctly', () => {
    const conversationWithTools: Conversation = {
      ...mockConversation,
      messages: [
        {
          sessionId: 'test-session-123',
          timestamp: '2024-01-01T12:00:00Z',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                name: 'Read',
                input: { file_path: '/test/file.ts' }
              }
            ]
          },
          cwd: '/test/project'
        }
      ]
    };

    const { lastFrame } = render(
      <ConversationPreviewFull conversation={conversationWithTools} />
    );
    
    const output = lastFrame();
    expect(output).toContain('[Tool: Read]');
    expect(output).toContain('/test/file.ts');
  });

  it('should hide tool messages when hideOptions includes tool', () => {
    const conversationWithTools: Conversation = {
      ...mockConversation,
      messages: [
        {
          sessionId: 'test-session-123',
          timestamp: '2024-01-01T12:00:00Z',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                name: 'Read',
                input: { file_path: '/test/file.ts' }
              }
            ]
          },
          cwd: '/test/project'
        }
      ]
    };

    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={conversationWithTools} 
        hideOptions={['tool']}
      />
    );
    
    const output = lastFrame();
    expect(output).not.toContain('[Tool: Read]');
  });

  it('should display thinking messages correctly', () => {
    const conversationWithThinking: Conversation = {
      ...mockConversation,
      messages: [
        {
          sessionId: 'test-session-123',
          timestamp: '2024-01-01T12:00:00Z',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: 'This is my thought process'
              }
            ]
          },
          cwd: '/test/project'
        }
      ]
    };

    const { lastFrame } = render(
      <ConversationPreviewFull conversation={conversationWithThinking} />
    );
    
    const output = lastFrame();
    expect(output).toContain('[Thinking...]');
    expect(output).toContain('This is my thought process');
  });

  it('should hide thinking messages when hideOptions includes thinking', () => {
    const conversationWithThinking: Conversation = {
      ...mockConversation,
      messages: [
        {
          sessionId: 'test-session-123',
          timestamp: '2024-01-01T12:00:00Z',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: [
              {
                type: 'thinking',
                thinking: 'This is my thought process'
              }
            ]
          },
          cwd: '/test/project'
        }
      ]
    };

    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={conversationWithThinking} 
        hideOptions={['thinking']}
      />
    );
    
    const output = lastFrame();
    expect(output).not.toContain('[Thinking...]');
    expect(output).not.toContain('This is my thought process');
  });

  it('should hide simple thinking string messages when hideOptions includes thinking', () => {
    const conversationWithThinking: Conversation = {
      ...mockConversation,
      messages: [
        {
          sessionId: 'test-session-123',
          timestamp: '2024-01-01T12:00:00Z',
          type: 'assistant',
          message: {
            role: 'assistant',
            content: '[Thinking...]'
          },
          cwd: '/test/project'
        }
      ]
    };

    const { lastFrame } = render(
      <ConversationPreviewFull 
        conversation={conversationWithThinking} 
        hideOptions={['thinking']}
      />
    );
    
    const output = lastFrame();
    expect(output).not.toContain('[Thinking...]');
  });
});