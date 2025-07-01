import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const testData = [
  {
    sessionId: "test-session-123",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    type: "user",
    message: {
      role: "user",
      content: "Help me implement a new feature for user authentication"
    },
    cwd: "/home/user/projects/myapp"
  },
  {
    sessionId: "test-session-123",
    timestamp: new Date(Date.now() - 3000000).toISOString(),
    type: "assistant",
    message: {
      role: "assistant",
      content: "I'll help you implement user authentication. Let me start by..."
    },
    cwd: "/home/user/projects/myapp"
  }
];

async function createTestData() {
  const testDir = join(homedir(), '.claude', 'projects', '-home-user-projects-myapp');
  await mkdir(testDir, { recursive: true });
  
  const testFile = join(testDir, 'test-session-123.jsonl');
  const content = testData.map(d => JSON.stringify(d)).join('\n');
  
  await writeFile(testFile, content);
  console.log('Test data created at:', testFile);
}

createTestData().catch(console.error);