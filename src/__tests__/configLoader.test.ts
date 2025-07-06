import { jest } from '@jest/globals';
import { beforeEach, describe, expect, it } from '@jest/globals';

// Manual mocks
const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockHomedir = jest.fn();

jest.unstable_mockModule('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

jest.unstable_mockModule('os', () => ({
  homedir: mockHomedir,
}));

// Dynamic imports after mocking
const { getConfigPath, loadConfig } = await import('../utils/configLoader.js');
const { defaultConfig } = await import('../types/config.js');

describe('configLoader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.XDG_CONFIG_HOME;
  });

  describe('getConfigPath', () => {
    it('should use XDG_CONFIG_HOME when set', () => {
      process.env.XDG_CONFIG_HOME = '/custom/config';
      const path = getConfigPath();
      expect(path).toBe('/custom/config/ccresume/config.toml');
    });

    it('should use ~/.config when XDG_CONFIG_HOME is not set', () => {
      mockHomedir.mockReturnValue('/home/user');
      const path = getConfigPath();
      expect(path).toBe('/home/user/.config/ccresume/config.toml');
    });
  });

  describe('loadConfig', () => {
    it('should return default config when config file does not exist', () => {
      mockHomedir.mockReturnValue('/home/user');
      mockExistsSync.mockReturnValue(false);
      
      const config = loadConfig();
      expect(config).toEqual(defaultConfig);
    });

    it('should load and parse config file when it exists', () => {
      mockHomedir.mockReturnValue('/home/user');
      mockExistsSync.mockReturnValue(true);
      
      const tomlContent = `
[keybindings]
quit = ["q", "ctrl+c"]
selectPrevious = ["up"]
selectNext = ["down"]
      `;
      mockReadFileSync.mockReturnValue(tomlContent);
      
      const config = loadConfig();
      expect(config.keybindings.quit).toEqual(['q', 'ctrl+c']);
      expect(config.keybindings.selectPrevious).toEqual(['up']);
      expect(config.keybindings.selectNext).toEqual(['down']);
      // Other keybindings should still have default values
      expect(config.keybindings.confirm).toEqual(defaultConfig.keybindings.confirm);
    });

    it('should merge partial config with defaults', () => {
      mockHomedir.mockReturnValue('/home/user');
      mockExistsSync.mockReturnValue(true);
      
      const tomlContent = `
[keybindings]
quit = ["esc"]
      `;
      mockReadFileSync.mockReturnValue(tomlContent);
      
      const config = loadConfig();
      expect(config.keybindings.quit).toEqual(['esc']);
      // All other keybindings should have default values
      expect(config.keybindings.selectPrevious).toEqual(defaultConfig.keybindings.selectPrevious);
      expect(config.keybindings.selectNext).toEqual(defaultConfig.keybindings.selectNext);
    });

    it('should return default config on parse error', () => {
      mockHomedir.mockReturnValue('/home/user');
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('invalid toml content {{{');
      
      // Mock console.error to suppress error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const config = loadConfig();
      expect(config).toEqual(defaultConfig);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle file read errors gracefully', () => {
      mockHomedir.mockReturnValue('/home/user');
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Mock console.error to suppress error output in test
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const config = loadConfig();
      expect(config).toEqual(defaultConfig);
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });
});