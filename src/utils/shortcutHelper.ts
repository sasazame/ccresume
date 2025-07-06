import { Config } from '../types/config.js';

export function getShortcutText(config: Config): string {
  const shortcuts: string[] = [];
  
  // Format keybindings for display
  const formatKeys = (keys: string[]): string => {
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
  shortcuts.push(`Scroll: ${formatKeys(config.keybindings.scrollUp)}/${formatKeys(config.keybindings.scrollDown)}`);
  shortcuts.push(`Page: ${formatKeys(config.keybindings.scrollPageDown)}/${formatKeys(config.keybindings.scrollPageUp)}`);
  shortcuts.push(`Top: ${formatKeys(config.keybindings.scrollTop)}`);
  shortcuts.push(`Bottom: ${formatKeys(config.keybindings.scrollBottom)}`);
  shortcuts.push(`Enter: resume`);
  shortcuts.push(`${formatKeys(config.keybindings.copySessionId)}: copy session ID`);
  shortcuts.push(`${formatKeys(config.keybindings.quit)}: quit`);
  
  return shortcuts.join(' • ');
}