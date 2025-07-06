import { Key } from 'ink';

export function matchesKeyBinding(input: string, key: Key, bindings: string[]): boolean {
  for (const binding of bindings) {
    if (matchesKey(input, key, binding)) {
      return true;
    }
  }
  return false;
}

function matchesKey(input: string, key: Key, binding: string): boolean {
  // Special case: single uppercase letter is treated as shift+lowercase
  if (binding.length === 1 && binding === binding.toUpperCase() && binding !== binding.toLowerCase()) {
    return key.shift && input.toLowerCase() === binding.toLowerCase();
  }
  
  const parts = binding.toLowerCase().split('+');
  const hasCtrl = parts.includes('ctrl');
  const hasShift = parts.includes('shift');
  const hasMeta = parts.includes('cmd') || parts.includes('command') || parts.includes('meta');
  
  // Check modifiers must match exactly
  if (hasCtrl !== key.ctrl) return false;
  if (hasShift !== key.shift) return false;
  if (hasMeta !== key.meta) return false;
  
  // Get the main key (last part after removing modifiers)
  const mainKey = parts.filter(p => !['ctrl', 'shift', 'cmd', 'command', 'meta'].includes(p))[0];
  
  if (!mainKey) return false;
  
  // Special key mappings
  switch (mainKey) {
    case 'up':
    case 'uparrow':
      return key.upArrow;
    case 'down':
    case 'downarrow':
      return key.downArrow;
    case 'left':
    case 'leftarrow':
      return key.leftArrow;
    case 'right':
    case 'rightarrow':
      return key.rightArrow;
    case 'enter':
    case 'return':
      return key.return;
    case 'pageup':
      return key.pageUp;
    case 'pagedown':
      return key.pageDown;
    case 'backspace':
      return key.backspace;
    case 'delete':
      return key.delete;
    case 'escape':
    case 'esc':
      return key.escape;
    case 'tab':
      return key.tab;
    default:
      // For regular characters
      if (mainKey.length === 1) {
        return input.toLowerCase() === mainKey;
      }
      return false;
  }
}