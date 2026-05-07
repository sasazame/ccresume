import { jest } from '@jest/globals';
import { beforeEach, describe, expect, it } from '@jest/globals';
import type { Dirent } from 'fs';

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

function makeDirent(name: string, isDir: boolean): Dirent {
  return {
    name,
    parentPath: PROJECTS_DIR,
    path: PROJECTS_DIR,
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  } as unknown as Dirent;
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
      // Before the fix, readdir(projectPath) on these files would throw ENOTDIR.
      mockReaddir.mockImplementation((path: unknown, opts?: unknown) => {
        if (path === PROJECTS_DIR && (opts as { withFileTypes?: boolean } | undefined)?.withFileTypes) {
          return Promise.resolve([
            makeDirent('claude-code-log-cache.db', false),
            makeDirent('index.html', false),
            makeDirent('-Users-testuser-my-project', true),
          ]);
        }
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });

    it('returns empty array when projects dir does not exist', async () => {
      mockReaddir.mockRejectedValue(
        Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' })
      );

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });

    it('processes directory entries normally when no non-directory entries exist', async () => {
      mockReaddir.mockImplementation((path: unknown, opts?: unknown) => {
        if (path === PROJECTS_DIR && (opts as { withFileTypes?: boolean } | undefined)?.withFileTypes) {
          return Promise.resolve([
            makeDirent('-Users-testuser-my-project', true),
          ]);
        }
        // project dir contains no jsonl files
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it('returns empty array when projects dir is empty', async () => {
      mockReaddir.mockImplementation((_path: unknown, opts?: unknown) => {
        if ((opts as { withFileTypes?: boolean } | undefined)?.withFileTypes) {
          return Promise.resolve([]);
        }
        return Promise.resolve([]);
      });

      const result = await getAllConversations();
      expect(result).toEqual([]);
    });
  });

  describe('getPaginatedConversations', () => {
    it('ignores non-directory entries in projects dir to avoid ENOTDIR', async () => {
      mockReaddir.mockImplementation((path: unknown, opts?: unknown) => {
        if (path === PROJECTS_DIR && (opts as { withFileTypes?: boolean } | undefined)?.withFileTypes) {
          return Promise.resolve([
            makeDirent('claude-code-log-cache.db', false),
            makeDirent('index.html', false),
            makeDirent('-Users-testuser-my-project', true),
          ]);
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
