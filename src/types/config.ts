export interface KeyBindings {
  quit: string[];
  selectPrevious: string[];
  selectNext: string[];
  confirm: string[];
  copySessionId: string[];
  scrollUp: string[];
  scrollDown: string[];
  scrollPageUp: string[];
  scrollPageDown: string[];
  scrollTop: string[];
  scrollBottom: string[];
}

export interface Config {
  keybindings: KeyBindings;
}

export const defaultConfig: Config = {
  keybindings: {
    quit: ['q'],
    selectPrevious: ['up', 'k'],
    selectNext: ['down', 'j'],
    confirm: ['enter', 'return'],
    copySessionId: ['c'],
    scrollUp: ['k', 'ctrl+p'],
    scrollDown: ['j', 'ctrl+n'],
    scrollPageUp: ['u', 'ctrl+u', 'pageup'],
    scrollPageDown: ['d', 'ctrl+d', 'pagedown'],
    scrollTop: ['g'],
    scrollBottom: ['G', 'shift+g'],
  },
};