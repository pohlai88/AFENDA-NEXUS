'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PromptDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback when the dialog open state changes. */
  onOpenChange: (open: boolean) => void;
  /** Dialog title. */
  title: string;
  /** Descriptive body text. */
  description?: string;
  /** Label for the input field. */
  inputLabel?: string;
  /** Placeholder for the input field. */
  placeholder?: string;
  /** Label for the submit button (default: "Submit"). */
  submitLabel?: string;
  /** Whether empty input is allowed (default: false). */
  allowEmpty?: boolean;
  /** Called when the user submits with the entered value. */
  onSubmit: (value: string) => void;
}

// ─── PromptDialog ────────────────────────────────────────────────────────────

/**
 * A shadcn Dialog wrapper that replaces native `window.prompt()`.
 *
 * Usage:
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <PromptDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Reject items"
 *   description="Please provide a reason for rejection."
 *   inputLabel="Reason"
 *   submitLabel="Reject"
 *   onSubmit={(reason) => handleReject(reason)}
 * />
 * ```
 */
export function PromptDialog({
  open,
  onOpenChange,
  title,
  description,
  inputLabel = 'Value',
  placeholder,
  submitLabel = 'Submit',
  allowEmpty = false,
  onSubmit,
}: PromptDialogProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allowEmpty && !value.trim()) return;
    onSubmit(value.trim());
    setValue('');
    onOpenChange(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) setValue('');
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="my-4 grid gap-2">
            <Label htmlFor="prompt-dialog-input">{inputLabel}</Label>
            <Input
              id="prompt-dialog-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!allowEmpty && !value.trim()}
            >
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
PromptDialog.displayName = 'PromptDialog';
