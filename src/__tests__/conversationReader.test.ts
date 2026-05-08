import { jest } from '@jest/globals';
import { beforeEach, describe, expect, it } from '@jest/globals';

// FAKE_HOME must be defined before mockHomedir so the module-level homedir() call resolves.
const FAKE_HOME = '/home/testuser';
const PROJECTS_DIR = `${FAKE_HOME}/.claude/projects`;

const mockReaddir = jest.fn();
const mockReadFile = jest.fn();
const mockStat = jest.fn();
// Set initial return value here so conversationReader.ts's module-level `join(homedir(), ...)` works.
const mockHomedir = jest.fn().mockReturnValue(FAKE_HOME);

jest.unstable_mockModule('fs/promises', () => ({
  readdir: mockReaddir,
  readFile: mockReadFile,
  stat: mockStat,
}));

jest.unstable_mockModule('os', () => ({
  homedir: mockHomedir,
}));

const { getAllConversations, getPaginatedConversations } = await import('../utils/conversationReader.js');

function makeEnotdir(): Error {
  return Object.assign(new Error('ENOTDIR: not a directory'), { code: 'ENOTDIR' });
}

function makeEnoent(): Error {
  return Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' });
}

const VALID_UUID = '12345678-1234-1234-1234-123456789abc';
const VALID_JSONL_FILE = `${VALID_UUID}.jsonl`;
const VALID_JSONL_PAYLOAD = JSON.stringify({
  type: 'user',
  message: { content: 'hello world' },
  timestamp: '2026-05-07T10:00:00.000Z',
  cwd: '/Users/testuser/my-project',
  gitBranch: 'main',
});

describe('conversationReader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore after clearAllMocks since homedir is consumed at module-level.
    mockHomedir.mockReturnValue(FAKE_HOME);
  });

  describe('getAllConversations', () => {
    it('ignores non-directory entries in projects dir to avoid ENOTDIR', async () => {
      // Simulates claude-code-log placing cache.db and index.html alongside project dirs.
      // readdir(projectPath) on those files throws ENOTDIR, which must be silently skipped.
      // Also verifies that the valid sibling directory is still scanned and returns conversations.
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['claude-code-log-cache.db', 'index.html', '-Users-testuser-my-project']);
        }
        if (path === `${PROJECTS_DIR}/claude-code-log-cache.db`) {
          return Promise.reject(makeEnotdir());
        }
        if (path === `${PROJECTS_DIR}/index.html`) {
          return Promise.reject(makeEnotdir());
        }
        if (path === `${PROJECTS_DIR}/-Users-testuser-my-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);

      const result = await getAllConversations();
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe(VALID_UUID);
    });

    it('scans symlinked project directories and returns conversations from them', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['symlinked-project']);
        }
        if (path === `${PROJECTS_DIR}/symlinked-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);

      const result = await getAllConversations();
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe(VALID_UUID);
      expect(result[0].firstMessage).toBe('hello world');
    });

    it('skips broken symlinks (ENOENT on inner readdir) without discarding sibling conversations', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['broken-symlink', '-Users-testuser-my-project']);
        }
        if (path === `${PROJECTS_DIR}/broken-symlink`) {
          return Promise.reject(makeEnoent());
        }
        if (path === `${PROJECTS_DIR}/-Users-testuser-my-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);

      const result = await getAllConversations();
      expect(result).toHaveLength(1);
      expect(result[0].sessionId).toBe(VALID_UUID);
    });

    it('returns empty array when projects dir does not exist', async () => {
      mockReaddir.mockRejectedValue(
        Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
      );

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });

    it('returns empty array when projects dir is empty', async () => {
      mockReaddir.mockImplementation(() => {
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedConversations', () => {
    it('ignores non-directory entries in projects dir to avoid ENOTDIR', async () => {
      // Also verifies that the valid sibling directory is still scanned and returns conversations.
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['claude-code-log-cache.db', 'index.html', '-Users-testuser-my-project']);
        }
        if (path === `${PROJECTS_DIR}/claude-code-log-cache.db`) {
          return Promise.reject(makeEnotdir());
        }
        if (path === `${PROJECTS_DIR}/index.html`) {
          return Promise.reject(makeEnotdir());
        }
        if (path === `${PROJECTS_DIR}/-Users-testuser-my-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);
      mockStat.mockResolvedValue({ mtime: new Date('2026-05-07T10:00:00.000Z') });

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].sessionId).toBe(VALID_UUID);
    });

    it('scans symlinked project directories and returns conversations from them', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['symlinked-project']);
        }
        if (path === `${PROJECTS_DIR}/symlinked-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);
      mockStat.mockResolvedValue({ mtime: new Date('2026-05-07T10:00:00.000Z') });

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].sessionId).toBe(VALID_UUID);
      expect(result.conversations[0].firstMessage).toBe('hello world');
    });

    it('skips broken symlinks (ENOENT on inner readdir) without discarding sibling conversations', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['broken-symlink', '-Users-testuser-my-project']);
        }
        if (path === `${PROJECTS_DIR}/broken-symlink`) {
          return Promise.reject(makeEnoent());
        }
        if (path === `${PROJECTS_DIR}/-Users-testuser-my-project`) {
          return Promise.resolve([VALID_JSONL_FILE]);
        }
        return Promise.resolve([]);
      });
      mockReadFile.mockResolvedValue(VALID_JSONL_PAYLOAD);
      mockStat.mockResolvedValue({ mtime: new Date('2026-05-07T10:00:00.000Z') });

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].sessionId).toBe(VALID_UUID);
    });

    it('returns empty conversations and total=0 when projects dir does not exist', async () => {
      mockReaddir.mockRejectedValue(
        Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
      );

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
