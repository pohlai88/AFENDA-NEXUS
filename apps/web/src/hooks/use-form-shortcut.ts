'use client';

import { useCallback } from 'react';
import { useRegisterShortcut } from '@/providers/shortcut-provider';

/**
 * Register mod+S (save) and optionally mod+Enter (save and close) for the current form.
 * Call from form components that want keyboard-driven submit.
 *
 * @example
 * ```tsx
 * const form = useForm(...);
 * useFormShortcut({
 *   onSave: () => form.handleSubmit(onValid)(),
 *   onSaveAndClose: () => form.handleSubmit(() => onValid().then(() => router.back()))(),
 * });
 * ```
 */
export interface UseFormShortcutOptions {
  /** Called when mod+S is pressed. Typically form.handleSubmit(onValid). */
  onSave: () => void;
  /** Called when mod+Enter is pressed. Optional; defaults to onSave. */
  onSaveAndClose?: () => void;
  /** Scope for the shortcuts. Default "page". Use "dialog" when form is in a dialog. */
  scope?: 'page' | 'dialog';
}

export function useFormShortcut({
  onSave,
  onSaveAndClose,
  scope = 'page',
}: UseFormShortcutOptions): void {
  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  const handleSaveAndClose = useCallback(() => {
    (onSaveAndClose ?? onSave)();
  }, [onSaveAndClose, onSave]);

  useRegisterShortcut(
    'form-save',
    'mod+s',
    'Save form',
    handleSave,
    scope,
  );

  useRegisterShortcut(
    'form-save-and-close',
    'mod+enter',
    'Save and close',
    handleSaveAndClose,
    scope,
  );
}
