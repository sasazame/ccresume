import { parse } from '@iarna/toml';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Config, defaultConfig } from '../types/config.js';

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
    return mergeConfigs(defaultConfig, parsedConfig);
  } catch (error) {
    console.error(`Failed to load config from ${configPath}:`, error);
    return defaultConfig;
  }
}

function mergeConfigs(defaultConf: Config, userConf: Partial<Config>): Config {
  const merged: Config = JSON.parse(JSON.stringify(defaultConf));
  
  if (userConf.keybindings) {
    Object.keys(userConf.keybindings).forEach((key) => {
      const userBinding = userConf.keybindings![key as keyof typeof userConf.keybindings];
      if (userBinding) {
        merged.keybindings[key as keyof typeof merged.keybindings] = userBinding;
      }
    });
  }
  
  return merged;
}