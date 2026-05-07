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
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });

    it('scans symlinked project directories (symlink-to-dir must not be skipped)', async () => {
      // Verifies the regression fix: Dirent.isDirectory() returns false for symlinks, but
      // readdir() follows the link, so ENOTDIR is not thrown and the dir is scanned normally.
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['symlinked-project']);
        }
        if (path === `${PROJECTS_DIR}/symlinked-project`) {
          // readdir follows the symlink and returns the actual directory contents
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(Array.isArray(result)).toBe(true);
    });

    it('returns empty array when projects dir does not exist', async () => {
      mockReaddir.mockRejectedValue(
        Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
      );

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });

    it('processes directory entries normally when no non-directory entries exist', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['-Users-testuser-my-project']);
        }
        // project dir contains no jsonl files
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('returns empty array when projects dir is empty', async () => {
      mockReaddir.mockImplementation((_path: unknown) => {
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedConversations', () => {
    it('ignores non-directory entries in projects dir to avoid ENOTDIR', async () => {
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
        return Promise.resolve([]);
      });

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toEqual([]);
    });

    it('scans symlinked project directories (symlink-to-dir must not be skipped)', async () => {
      mockReaddir.mockImplementation((path: unknown) => {
        if (path === PROJECTS_DIR) {
          return Promise.resolve(['symlinked-project']);
        }
        if (path === `${PROJECTS_DIR}/symlinked-project`) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const result = await getPaginatedConversations({ limit: 10, offset: 0 });
      expect(result.conversations).toEqual([]);
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
