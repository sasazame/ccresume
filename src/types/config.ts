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
  pageNext: string[];
  pagePrevious: string[];
  startNewSession: string[];
}

export interface Config {
  keybindings: KeyBindings;
}

export const defaultConfig: Config = {
  keybindings: {
    quit: ['q'],
    selectPrevious: ['up'],
    selectNext: ['down'],
    confirm: ['enter'],
    copySessionId: ['c'],
    scrollUp: ['k'],
    scrollDown: ['j'],
    scrollPageUp: ['u', 'pageup'],
    scrollPageDown: ['d', 'pagedown'],
    scrollTop: ['g'],
    scrollBottom: ['G'],
    pageNext: ['right'],
    pagePrevious: ['left'],
    startNewSession: ['n'],
  },
};