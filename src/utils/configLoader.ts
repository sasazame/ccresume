import { parse } from '@iarna/toml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Config, defaultConfig, KeyBindings } from '../types/config.js';

export function getConfigPath(): string {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(xdgConfigHome, 'ccresume', 'config.toml');
}

export function loadConfig(): Config {
  const configPath = getConfigPath();
  
  if (!existsSync(configPath)) {
    return defaultConfig;
  }
  
  try {
    const tomlContent = readFileSync(configPath, 'utf-8');
    const parsedConfig = parse(tomlContent) as Partial<Config>;
    
    // Merge with default config to ensure all keys exist
    const config = mergeConfigs(defaultConfig, parsedConfig);
    
    // Check for key conflicts and warn user
    const conflicts = checkKeyConflicts(config.keybindings);
    if (conflicts.length > 0) {
      console.error('\n⚠️  Key binding conflicts detected:');
      conflicts.forEach(conflict => console.error(`   - ${conflict}`));
      console.error('   Please update your config.toml to resolve conflicts.\n');
    }
    
    return config;
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
    return defaultConfig;
  }
}

function mergeConfigs(defaultConf: Config, userConf: Partial<Config>): Config {
  const merged: Config = JSON.parse(JSON.stringify(defaultConf));
  
  // First, apply user configuration
  if (userConf.keybindings) {
    Object.keys(userConf.keybindings).forEach((key) => {
      const userBinding = userConf.keybindings![key as keyof typeof userConf.keybindings];
      if (userBinding) {
        merged.keybindings[key as keyof typeof merged.keybindings] = userBinding;
      }
    });
  }
  
  // Then migrate config with conflict detection based on the merged result
  return migrateConfig(merged, userConf);
}

function migrateConfig(config: Config, userConf: Partial<Config>): Config {
  // Only migrate if user hasn't explicitly configured startNewSession
  const userHasStartNewSession = userConf.keybindings && 'startNewSession' in userConf.keybindings;
  
  if (!userHasStartNewSession) {
    // Check if 'n' is already used by another keybinding
    const isNKeyUsed = isKeyAlreadyAssigned(config.keybindings, 'n');
    
    if (!isNKeyUsed) {
      // Only assign 'n' if it's not already in use
      config.keybindings.startNewSession = ['n'];
    } else {
      // If 'n' is taken, don't assign any default key
      // User must configure it manually in config.toml
      config.keybindings.startNewSession = [];
    }
  }
  
  return config;
}

function isKeyAlreadyAssigned(keybindings: KeyBindings, key: string): boolean {
  // Check all existing keybindings to see if the key is already used
  for (const [action, keys] of Object.entries(keybindings)) {
    if (action === 'startNewSession') continue; // Skip the key we're trying to add
    
    if (Array.isArray(keys) && keys.includes(key)) {
      return true;
    }
  }
  
  return false;
}

function checkKeyConflicts(keybindings: KeyBindings): string[] {
  const conflicts: string[] = [];
  const keyToActions = new Map<string, string[]>();
  
  // Build a map of key -> [actions]
  for (const [action, keys] of Object.entries(keybindings)) {
    if (!Array.isArray(keys)) continue;
    
    for (const key of keys) {
      if (!keyToActions.has(key)) {
        keyToActions.set(key, []);
      }
      keyToActions.get(key)!.push(action);
    }
  }
  
  // Find conflicts (keys assigned to multiple actions)
  for (const [key, actions] of keyToActions.entries()) {
    if (actions.length > 1) {
      conflicts.push(`Key '${key}' is assigned to multiple actions: ${actions.join(', ')}`);
    }
  }
  
  return conflicts;
}