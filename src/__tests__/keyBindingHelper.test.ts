import { Key } from 'ink';
import { matchesKeyBinding } from '../utils/keyBindingHelper.js';

describe('keyBindingHelper', () => {
  describe('matchesKeyBinding', () => {
    it('should match single character keys', () => {
      const key: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('q', key, ['q'])).toBe(true);
      expect(matchesKeyBinding('q', key, ['a'])).toBe(false);
      expect(matchesKeyBinding('a', key, ['a', 'b', 'c'])).toBe(true);
    });

    it('should match arrow keys', () => {
      const upKey: Key = {
        upArrow: true,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('', upKey, ['up'])).toBe(true);
      expect(matchesKeyBinding('', upKey, ['uparrow'])).toBe(true);
      expect(matchesKeyBinding('', upKey, ['down'])).toBe(false);
    });

    it('should match special keys', () => {
      const returnKey: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: true,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('', returnKey, ['enter'])).toBe(true);
      expect(matchesKeyBinding('', returnKey, ['return'])).toBe(true);
      expect(matchesKeyBinding('', returnKey, ['space'])).toBe(false);
    });

    it('should match modifier combinations', () => {
      const ctrlC: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: true,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('c', ctrlC, ['ctrl+c'])).toBe(true);
      expect(matchesKeyBinding('c', ctrlC, ['c'])).toBe(false);
      expect(matchesKeyBinding('a', ctrlC, ['ctrl+a'])).toBe(true);
    });

    it('should match shift combinations', () => {
      const shiftG: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: true,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('g', shiftG, ['shift+g'])).toBe(true);
      expect(matchesKeyBinding('g', shiftG, ['G'])).toBe(true);
      expect(matchesKeyBinding('g', shiftG, ['g'])).toBe(false);
    });

    it('should handle case insensitive matching', () => {
      const key: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('A', key, ['a'])).toBe(true);
      expect(matchesKeyBinding('a', key, ['a'])).toBe(true);
      
      // 'A' binding requires shift key
      expect(matchesKeyBinding('a', key, ['A'])).toBe(false);
    });

    it('should match pageup/pagedown keys', () => {
      const pageDownKey: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: true,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('', pageDownKey, ['pagedown'])).toBe(true);
      expect(matchesKeyBinding('', pageDownKey, ['pageup'])).toBe(false);
    });

    it('should match escape key', () => {
      const escapeKey: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: true,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('', escapeKey, ['escape'])).toBe(true);
      expect(matchesKeyBinding('', escapeKey, ['esc'])).toBe(true);
    });

    it('should match meta/cmd key combinations', () => {
      const metaQ: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: true,
      };

      expect(matchesKeyBinding('q', metaQ, ['cmd+q'])).toBe(true);
      expect(matchesKeyBinding('q', metaQ, ['command+q'])).toBe(true);
      expect(matchesKeyBinding('q', metaQ, ['meta+q'])).toBe(true);
      expect(matchesKeyBinding('q', metaQ, ['q'])).toBe(false);
    });

    it('should not match when no bindings are provided', () => {
      const key: Key = {
        upArrow: false,
        downArrow: false,
        leftArrow: false,
        rightArrow: false,
        pageDown: false,
        pageUp: false,
        return: false,
        escape: false,
        ctrl: false,
        shift: false,
        tab: false,
        backspace: false,
        delete: false,
        meta: false,
      };

      expect(matchesKeyBinding('q', key, [])).toBe(false);
    });
  });
});