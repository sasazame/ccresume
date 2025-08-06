export interface Message {
  sessionId: string;
  timestamp: string;
  type: 'user' | 'assistant';
  message?: {
    role: 'user' | 'assistant';
    content?: string | Array<{ type: string; text?: string; name?: string; input?: unknown; tool_use_id?: string; thinking?: string }>;
  };
  cwd: string;
  toolUseResult?: {
    stdout?: string;
    stderr?: string;
    filenames?: string[];
    durationMs?: number;
    interrupted?: boolean;
    isImage?: boolean;
    // TodoWrite results
    oldTodos?: Array<{ id: string; content: string; status: string; priority: string }>;
    newTodos?: Array<{ id: string; content: string; status: string; priority: string }>;
    // Read results
    file?: {
      filePath: string;
      content: string;
      numLines: number;
      startLine: number;
      totalLines: number;
    };
    filePath?: string;
    numLines?: number;
    // Edit results
    oldString?: string;
    newString?: string;
    originalFile?: string;
    replaceAll?: boolean;
    structuredPatch?: unknown;
    userModified?: boolean;
    // Other tool results
    type?: string;
    content?: string;
    mode?: string;
    numFiles?: number;
    totalDurationMs?: number;
    totalTokens?: number;
    totalToolUseCount?: number;
    usage?: unknown;
  };
}

export interface Conversation {
  sessionId: string;
  projectPath: string;
  projectName: string;
  gitBranch?: string | null;
  messages: Message[];
  firstMessage: string;
  lastMessage: string;
  startTime: Date;
  endTime: Date;
}