// ─── Shortcut Engine ──────────────────────────────────────────────────────────
//
// Input-safe, scope-aware, sequence-capable keyboard shortcut engine.
//
// Features:
// - Input safety: ignores shortcuts when focus is in input/textarea/select/contenteditable
// - Modal awareness: only dialog-scoped shortcuts fire when a dialog is open
// - Scope priority: dialog > cmdk > sheet > table > page > global
// - Multi-key sequences: buffer system with 500ms timeout (e.g. "g j")
// - Single event listener on document
//
// ─────────────────────────────────────────────────────────────────────────────

import { toSorted } from '@/lib/utils/array';

/** Scope priority — higher wins. */
export type ShortcutScope = 'dialog' | 'cmdk' | 'sheet' | 'table' | 'page' | 'global';

const SCOPE_PRIORITY: Record<ShortcutScope, number> = {
  dialog: 60,
  cmdk: 50,
  sheet: 40,
  table: 30,
  page: 20,
  global: 10,
};

/** A registered shortcut binding. */
export interface ShortcutRegistration {
  /** Unique identifier (e.g. "nav-journals"). */
  id: string;
  /** Key sequence — single key ("?") or multi-key ("g j"). */
  keys: string;
  /** Human-readable description for the shortcut dialog. */
  description: string;
  /** Callback to execute when matched. */
  handler: () => void;
  /** Scope this shortcut is active in. Defaults to "global". */
  scope: ShortcutScope;
}

// ─── ShortcutEngine ──────────────────────────────────────────────────────────

export class ShortcutEngine {
  private shortcuts = new Map<string, ShortcutRegistration>();
  private scopeStack: ShortcutScope[] = ['global'];
  private buffer: string[] = [];
  private bufferTimer: ReturnType<typeof setTimeout> | null = null;
  private listening = false;
  private boundHandler: ((e: KeyboardEvent) => void) | null = null;
  private boundFocusHandler: (() => void) | null = null;

  /** Sequence buffer timeout in ms. */
  private readonly BUFFER_TIMEOUT = 500;

  // ─── Registration ──────────────────────────────────────────────────────

  register(reg: Omit<ShortcutRegistration, 'scope'> & { scope?: ShortcutScope }): void {
    this.shortcuts.set(reg.id, { ...reg, scope: reg.scope ?? 'global' });
  }

  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  getRegistered(): ShortcutRegistration[] {
    return Array.from(this.shortcuts.values());
  }

  // ─── Scope Stack ──────────────────────────────────────────────────────

  pushScope(scope: ShortcutScope): void {
    this.scopeStack.push(scope);
  }

  popScope(scope: ShortcutScope): void {
    // Remove the most recent occurrence of this scope
    const idx = this.scopeStack.lastIndexOf(scope);
    if (idx > 0) {
      this.scopeStack.splice(idx, 1);
    }
  }

  private getActiveScope(): ShortcutScope {
    return this.scopeStack[this.scopeStack.length - 1] ?? 'global';
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  start(): void {
    if (this.listening || typeof document === 'undefined') return;

    this.boundHandler = this.handleKeyDown.bind(this);
    this.boundFocusHandler = this.resetBuffer.bind(this);

    document.addEventListener('keydown', this.boundHandler);
    document.addEventListener('focusin', this.boundFocusHandler);
    this.listening = true;
  }

  stop(): void {
    if (!this.listening || typeof document === 'undefined') return;

    if (this.boundHandler) {
      document.removeEventListener('keydown', this.boundHandler);
    }
    if (this.boundFocusHandler) {
      document.removeEventListener('focusin', this.boundFocusHandler);
    }

    this.resetBuffer();
    this.listening = false;
  }

  // ─── Key Handling ──────────────────────────────────────────────────────

  private handleKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;

    // Escape always fires (for clearing search, closing dialogs)
    if (e.key === 'Escape') {
      this.resetBuffer();
      this.dispatchMatches('Escape', e);
      return;
    }

    // Input safety: skip shortcuts when user is typing in an input field
    if (this.isInputFocused(target)) {
      // Exception: allow Cmd/Ctrl shortcuts (like Cmd+K) even in inputs
      if (!e.metaKey && !e.ctrlKey) return;
    }

    // Modal awareness: check for open dialogs
    const hasOpenDialog = this.hasOpenDialog();

    // Normalize the key string
    const keyStr = this.normalizeKey(e);

    // Handle modifier keys — reset buffer on raw modifier press
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      this.resetBuffer();
      return;
    }

    // For modifier combos (Cmd+K, Ctrl+\, Shift+A), match immediately (no buffer)
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      this.resetBuffer();
      this.dispatchMatches(keyStr, e, hasOpenDialog);
      return;
    }

    // Sequence buffering for plain keys
    this.buffer.push(e.key.toLowerCase());

    // Clear previous timer
    if (this.bufferTimer) clearTimeout(this.bufferTimer);

    // Try matching the full buffer as a sequence
    const sequence = this.buffer.join(' ');
    const matched = this.dispatchMatches(sequence, e, hasOpenDialog);

    if (matched) {
      this.resetBuffer();
    } else {
      // Capture the current buffer key for the timeout closure.
      // We cannot use the original KeyboardEvent `e` because by the
      // time the timeout fires the event lifecycle is complete and
      // `preventDefault()` / `stopPropagation()` would be no-ops.
      const pendingKey = this.buffer[0];

      // Set timer to reset buffer if no second key arrives
      this.bufferTimer = setTimeout(() => {
        // If buffer has only one key and it didn't match a sequence,
        // try matching it as a single key shortcut
        if (this.buffer.length === 1 && pendingKey) {
          this.dispatchMatchesByKey(pendingKey, hasOpenDialog);
        }
        this.resetBuffer();
      }, this.BUFFER_TIMEOUT);
    }
  }

  private dispatchMatches(keyStr: string, e: KeyboardEvent, hasOpenDialog = false): boolean {
    const activeScope = this.getActiveScope();

    // Collect matching shortcuts
    const matches: ShortcutRegistration[] = [];

    for (const reg of this.shortcuts.values()) {
      if (reg.keys !== keyStr) continue;

      // Modal awareness: if a dialog is open, only dialog-scoped shortcuts fire
      if (hasOpenDialog && reg.scope !== 'dialog' && !this.isModifierCombo(keyStr)) {
        continue;
      }

      // Scope filtering: only active scope or lower-priority
      if (SCOPE_PRIORITY[reg.scope] > SCOPE_PRIORITY[activeScope]) {
        continue;
      }

      matches.push(reg);
    }

    if (matches.length === 0) return false;

    // Execute highest-priority match only (RBP-03: toSorted for immutability)
    const sorted = toSorted(matches, (a, b) => SCOPE_PRIORITY[b.scope] - SCOPE_PRIORITY[a.scope]);
    const winner = sorted[0];
    if (!winner) return false;

    e.preventDefault();
    e.stopPropagation();
    winner.handler();

    return true;
  }

  /**
   * Dispatch matches by key string only — used in the buffer timeout
   * where the original KeyboardEvent is no longer actionable (its
   * lifecycle has ended, so preventDefault/stopPropagation are no-ops).
   */
  private dispatchMatchesByKey(keyStr: string, hasOpenDialog = false): boolean {
    const activeScope = this.getActiveScope();
    const matches: ShortcutRegistration[] = [];

    for (const reg of this.shortcuts.values()) {
      if (reg.keys !== keyStr) continue;
      if (hasOpenDialog && reg.scope !== 'dialog' && !this.isModifierCombo(keyStr)) continue;
      if (SCOPE_PRIORITY[reg.scope] > SCOPE_PRIORITY[activeScope]) continue;
      matches.push(reg);
    }

    if (matches.length === 0) return false;

    const sorted = toSorted(matches, (a, b) => SCOPE_PRIORITY[b.scope] - SCOPE_PRIORITY[a.scope]);
    const winner = sorted[0];
    if (!winner) return false;
    winner.handler();
    return true;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private isInputFocused(target: HTMLElement | null): boolean {
    if (!target) return false;
    const tag = target.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (target.isContentEditable) return true;
    return false;
  }

  private hasOpenDialog(): boolean {
    if (typeof document === 'undefined') return false;
    return !!document.querySelector(
      '[role="dialog"]:not([hidden]), [role="alertdialog"]:not([hidden])',
    );
  }

  private normalizeKey(e: KeyboardEvent): string {
    const parts: string[] = [];
    // Distinguish Ctrl-only (e.g. Ctrl+Q for Quick Actions) from Cmd/Ctrl (mod)
    if (e.ctrlKey && !e.metaKey) {
      parts.push('ctrl');
    } else if (e.metaKey || e.ctrlKey) {
      parts.push('mod');
    }
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }

  private isModifierCombo(keyStr: string): boolean {
    return (
      keyStr.includes('mod+') ||
      keyStr.includes('ctrl+') ||
      keyStr.includes('alt+') ||
      keyStr.includes('shift+')
    );
  }

  private resetBuffer(): void {
    this.buffer = [];
    if (this.bufferTimer) {
      clearTimeout(this.bufferTimer);
      this.bufferTimer = null;
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let _engine: ShortcutEngine | null = null;

/**
 * Get the global ShortcutEngine singleton.
 * Lazily created on first access.
 */
export function getShortcutEngine(): ShortcutEngine {
  if (!_engine) {
    _engine = new ShortcutEngine();
  }
  return _engine;
}
