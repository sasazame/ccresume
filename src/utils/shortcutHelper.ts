import { Config } from '../types/config.js';

export function getShortcutText(config: Config, width?: number): string {
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
  
  // Determine which shortcuts to show based on available width
  const isNarrow = width && width < 120;
  
  if (isNarrow) {
    // Compact version for narrow terminals
    shortcuts.push(`↑↓:Nav`);
    shortcuts.push(`${formatKeys(config.keybindings.scrollUp)}${formatKeys(config.keybindings.scrollDown)}:Scroll`);
    shortcuts.push(`${formatKeys(config.keybindings.confirm)}:Resume`);
    shortcuts.push(`${formatKeys(config.keybindings.startNewSession)}:New Session`);
    shortcuts.push(`${formatKeys(config.keybindings.openCommandEditor)}:Edit Options`);
    shortcuts.push(`${formatKeys(config.keybindings.copySessionId)}:Copy`);
    shortcuts.push(`${formatKeys(config.keybindings.quit)}:Quit`);
    shortcuts.push(`${formatKeys(config.keybindings.toggleFullView)}:Full`);
  } else {
    // Full version for wider terminals - shortened where possible
    shortcuts.push(`Nav: ${formatKeys(config.keybindings.selectPrevious)}/${formatKeys(config.keybindings.selectNext)}`);
    shortcuts.push(`Scroll: ${formatKeys(config.keybindings.scrollUp)}/${formatKeys(config.keybindings.scrollDown)}`);
    shortcuts.push(`Page: ${formatKeys(config.keybindings.scrollPageUp)}/${formatKeys(config.keybindings.scrollPageDown)}`);
    shortcuts.push(`Top/Bottom: ${formatKeys(config.keybindings.scrollTop)}/${formatKeys(config.keybindings.scrollBottom)}`);
    shortcuts.push(`Resume: ${formatKeys(config.keybindings.confirm)}`);
    shortcuts.push(`New Session: ${formatKeys(config.keybindings.startNewSession)}`);
    shortcuts.push(`Edit Options: ${formatKeys(config.keybindings.openCommandEditor)}`);
    shortcuts.push(`Copy: ${formatKeys(config.keybindings.copySessionId)}`);
    shortcuts.push(`Quit: ${formatKeys(config.keybindings.quit)}`);
    shortcuts.push(`Full: ${formatKeys(config.keybindings.toggleFullView)} (experimental)`);
  }
  
  const shortcutText = shortcuts.join(' • ');
  
  return shortcutText;
}

export function hasKeyConflict(config: Config): boolean {
  // Check if any keybinding has 'undefined' (empty array)
  return Object.values(config.keybindings).some(keys => !keys || keys.length === 0);
}