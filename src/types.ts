export interface Message {
  sessionId: string;
  timestamp: string;
  type: 'user' | 'assistant';
  message?: {
    role: 'user' | 'assistant';
    content?: string | Array<{ type: string; text?: string; name?: string; input?: unknown; tool_use_id?: string }>;
  };
  cwd: string;
  toolUseResult?: {
    stdout?: string;
    stderr?: string;
    filenames?: string[];
    durationMs?: number;
    interrupted?: boolean;
    isImage?: boolean;
  };
}

export interface Conversation {
  sessionId: string;
  projectPath: string;
  projectName: string;
  messages: Message[];
  firstMessage: string;
  lastMessage: string;
  startTime: Date;
  endTime: Date;
}