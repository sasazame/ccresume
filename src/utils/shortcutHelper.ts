import { Config } from '../types/config.js';

export function getShortcutText(config: Config): string {
  const shortcuts: string[] = [];
  
  // Format keybindings for display
  const formatKeys = (keys: string[]): string => {
    // Handle empty key bindings
    if (!keys || keys.length === 0) {
      return 'undefined';
    }
    
    return keys.map(key => {
      // Convert special key names to display format
      if (key.includes('+')) {
        return key.split('+').map(part => {
          if (part === 'ctrl') return 'Ctrl';
          if (part === 'shift') return 'Shift';
          if (part === 'cmd' || part === 'command' || part === 'meta') return 'Cmd';
          return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('+');
      }
      // Special formatting for single keys
      if (key === 'up') return '↑';
      if (key === 'down') return '↓';
      if (key === 'enter' || key === 'return') return 'Enter';
      if (key === 'pageup') return 'PgUp';
      if (key === 'pagedown') return 'PgDn';
      return key;
    }).join('/');
  };
  
  // Build shortcuts in logical groups
  shortcuts.push(`Select: ${formatKeys(config.keybindings.selectPrevious)}/${formatKeys(config.keybindings.selectNext)}`);
  shortcuts.push(`Scroll: ${formatKeys(config.keybindings.scrollUp)}/${formatKeys(config.keybindings.scrollDown)}`);
  shortcuts.push(`Page: ${formatKeys(config.keybindings.scrollPageDown)}/${formatKeys(config.keybindings.scrollPageUp)}`);
  shortcuts.push(`Top: ${formatKeys(config.keybindings.scrollTop)}`);
  shortcuts.push(`Bottom: ${formatKeys(config.keybindings.scrollBottom)}`);
  shortcuts.push(`Resume: ${formatKeys(config.keybindings.confirm)}`);
  shortcuts.push(`New: ${formatKeys(config.keybindings.startNewSession)}`);
  shortcuts.push(`Copy ID: ${formatKeys(config.keybindings.copySessionId)}`);
  shortcuts.push(`Quit: ${formatKeys(config.keybindings.quit)}`);
  
  const shortcutText = shortcuts.join(' • ');
  
  return shortcutText;
}

export function hasKeyConflict(config: Config): boolean {
  // Check if any keybinding has 'undefined' (empty array)
  return Object.values(config.keybindings).some(keys => !keys || keys.length === 0);
}