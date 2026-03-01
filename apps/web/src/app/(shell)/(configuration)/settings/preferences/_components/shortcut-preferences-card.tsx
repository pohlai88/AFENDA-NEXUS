'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';
import { useShellPreferences } from '@/providers/shell-preferences-provider';
import { resolveShortcutKeys } from '@/lib/shortcuts/resolve-shortcut';
import { formatShortcutKey } from '@/lib/shortcuts/format-shortcut';
import { eventToKeyString, isValidShortcutKeys } from '@/lib/shortcuts/capture-key-combo';
import { SHELL_SHORTCUTS } from '@/lib/sidebar';
import { Keyboard, RotateCcw } from 'lucide-react';

/** Customizable shortcuts: id, default keys, label */
const CUSTOMIZABLE_SHORTCUTS: Array<{ id: string; defaultKeys: string; label: string }> = [
  { id: 'afenda-shortcut-dialog', defaultKeys: '?', label: 'Show keyboard shortcuts' },
  { id: 'afenda-command-palette', defaultKeys: 'mod+k', label: 'Open command palette' },
  { id: 'afenda-calculator', defaultKeys: 'mod+=', label: 'Open calculator' },
  { id: 'afenda-sidebar', defaultKeys: 'mod+b', label: 'Toggle sidebar' },
  { id: 'quick-action-picker', defaultKeys: 'ctrl+q', label: 'Open Quick Action picker' },
  { id: 'page-new', defaultKeys: 'n', label: 'New (contextual)' },
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `quick-action-${i + 1}`,
    defaultKeys: `ctrl+${i + 1}`,
    label: `Quick Action slot ${i + 1}`,
  })),
  ...SHELL_SHORTCUTS.map((s) => ({
    id: s.id,
    defaultKeys: s.keys,
    label: s.label,
  })),
];

const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

export function ShortcutPreferencesCard() {
  const { prefs, setPref } = useShellPreferences();
  const overrides = useMemo(() => prefs.shortcutOverrides ?? {}, [prefs.shortcutOverrides]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<string>('');
  const [captureError, setCaptureError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mac = isMac();

  const handleStartEdit = useCallback((id: string, currentKeys: string) => {
    setEditingId(id);
    setCapturedKeys(currentKeys);
    setCaptureError(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!editingId) {
      setEditingId(null);
      return;
    }
    const def = CUSTOMIZABLE_SHORTCUTS.find((s) => s.id === editingId);
    const keys = capturedKeys.trim();
    if (keys && !isValidShortcutKeys(keys)) {
      setCaptureError('Add at least one letter or number');
      return;
    }
    setCaptureError(null);
    const next = { ...overrides };
    if (keys && def && keys === def.defaultKeys) {
      delete next[editingId];
    } else if (keys) {
      // Conflict check: warn if another shortcut already uses these keys
      const conflict = CUSTOMIZABLE_SHORTCUTS.find(
        (s) => s.id !== editingId && resolveShortcutKeys(s.id, s.defaultKeys, next) === keys,
      );
      if (conflict) {
        setCaptureError(`Already used by "${conflict.label}". Change that shortcut first.`);
        return;
      }
      next[editingId] = keys;
    }
    setPref('shortcutOverrides', next);
    setEditingId(null);
  }, [editingId, capturedKeys, overrides, setPref]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!editingId) return;

      // Escape: close dialog without saving
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingId(null);
        return;
      }

      // Enter: save and close
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      const keys = eventToKeyString(e.nativeEvent);
      if (keys) {
        setCaptureError(isValidShortcutKeys(keys) ? null : 'Add at least one letter or number');
        setCapturedKeys(keys);
      }
    },
    [editingId, handleSave],
  );

  const handleReset = useCallback(() => {
    if (!editingId) return;
    const match = CUSTOMIZABLE_SHORTCUTS.find((s) => s.id === editingId);
    if (!match) return;
    const { defaultKeys } = match;
    setCapturedKeys(defaultKeys);
    setCaptureError(null);
  }, [editingId]);

  const handleResetAll = useCallback(() => {
    setPref('shortcutOverrides', {});
  }, [setPref]);

  const def = editingId ? CUSTOMIZABLE_SHORTCUTS.find((s) => s.id === editingId) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Keyboard Shortcuts</h3>
          <p className="text-muted-foreground text-xs">
            Customize shortcut keys. Changes apply immediately.
          </p>
        </div>
        {Object.keys(overrides).length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleResetAll}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reset all
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {CUSTOMIZABLE_SHORTCUTS.map(({ id, defaultKeys, label }) => {
          const currentKeys = resolveShortcutKeys(id, defaultKeys, overrides);
          return (
            <div
              key={id}
              className="flex items-center justify-between gap-4 rounded-md border px-3 py-2"
            >
              <span className="text-sm">{label}</span>
              <div className="flex items-center gap-2">
                <Kbd className="text-xs">{formatShortcutKey(currentKeys, mac)}</Kbd>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => handleStartEdit(id, currentKeys)}
                  aria-label={`Edit shortcut for ${label}`}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => !open && setEditingId(null)}>
        <DialogContent
          className="sm:max-w-md"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Change shortcut</DialogTitle>
            <DialogDescription>
              {def?.label}. Press the new key combination.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="shortcut-capture">Key combination</Label>
            {captureError && (
              <p className="text-destructive text-xs" role="alert">
                {captureError}
              </p>
            )}
            <input
              ref={inputRef}
              id="shortcut-capture"
              type="text"
              readOnly
              value={formatShortcutKey(capturedKeys, mac)}
              onKeyDown={handleKeyDown}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Key combination"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleReset}>
              Reset to default
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
