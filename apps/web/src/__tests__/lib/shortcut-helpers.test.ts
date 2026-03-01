import { describe, it, expect } from 'vitest';
import {
  resolveShortcutKeys,
} from '@/lib/shortcuts/resolve-shortcut';
import {
  eventToKeyString,
  isValidShortcutKeys,
} from '@/lib/shortcuts/capture-key-combo';

describe('resolveShortcutKeys', () => {
  it('returns default when overrides is null', () => {
    expect(resolveShortcutKeys('nav-journals', 'g j', null)).toBe('g j');
  });

  it('returns default when overrides is undefined', () => {
    expect(resolveShortcutKeys('nav-journals', 'g j', undefined)).toBe('g j');
  });

  it('returns default when id has no override', () => {
    expect(resolveShortcutKeys('nav-journals', 'g j', { 'nav-accounts': 'shift+a' })).toBe('g j');
  });

  it('returns override when id has override', () => {
    expect(resolveShortcutKeys('nav-journals', 'g j', { 'nav-journals': 'shift+j' })).toBe(
      'shift+j',
    );
  });

  it('returns default when override is empty string after trim', () => {
    expect(resolveShortcutKeys('nav-journals', 'g j', { 'nav-journals': '   ' })).toBe('g j');
  });
});

describe('eventToKeyString', () => {
  function createEvent(partial: Partial<KeyboardEvent>): KeyboardEvent {
    return {
      key: 'a',
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      ...partial,
    } as KeyboardEvent;
  }

  it('converts Ctrl+Shift+J to ctrl+shift+j', () => {
    const e = createEvent({ key: 'j', ctrlKey: true, shiftKey: true });
    expect(eventToKeyString(e)).toBe('ctrl+shift+j');
  });

  it('converts Cmd+K (or Ctrl when metaKey) to mod+k', () => {
    const e = createEvent({ key: 'k', metaKey: true });
    expect(eventToKeyString(e)).toBe('mod+k');
  });

  it('converts Ctrl+K to ctrl+k (distinguishes from Cmd)', () => {
    const e = createEvent({ key: 'k', ctrlKey: true, metaKey: false });
    expect(eventToKeyString(e)).toBe('ctrl+k');
  });

  it('converts Ctrl+Q (no meta) to ctrl+q', () => {
    const e = createEvent({ key: 'q', ctrlKey: true, metaKey: false });
    expect(eventToKeyString(e)).toBe('ctrl+q');
  });

  it('excludes modifier-only key press', () => {
    const e = createEvent({ key: 'Shift', shiftKey: true });
    expect(eventToKeyString(e)).toBe('shift');
  });
});

describe('isValidShortcutKeys', () => {
  it('rejects empty string', () => {
    expect(isValidShortcutKeys('')).toBe(false);
    expect(isValidShortcutKeys('   ')).toBe(false);
  });

  it('rejects modifier-only', () => {
    expect(isValidShortcutKeys('shift')).toBe(false);
    expect(isValidShortcutKeys('ctrl')).toBe(false);
    expect(isValidShortcutKeys('mod')).toBe(false);
    expect(isValidShortcutKeys('alt')).toBe(false);
  });

  it('accepts modifier + key', () => {
    expect(isValidShortcutKeys('mod+k')).toBe(true);
    expect(isValidShortcutKeys('ctrl+q')).toBe(true);
    expect(isValidShortcutKeys('shift+j')).toBe(true);
  });

  it('accepts single key', () => {
    expect(isValidShortcutKeys('n')).toBe(true);
    expect(isValidShortcutKeys('?')).toBe(true);
  });

  it('accepts sequence', () => {
    expect(isValidShortcutKeys('g j')).toBe(true);
  });
});
