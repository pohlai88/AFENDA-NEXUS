'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ACTION_BTN, ICON } from './shell.tokens';

// ─── Calculator logic ───────────────────────────────────────────────────────

const CALC_BUTTONS: { key: string; span?: number }[][] = [
  [{ key: 'C' }, { key: '±' }, { key: '%' }, { key: '÷' }],
  [{ key: '7' }, { key: '8' }, { key: '9' }, { key: '×' }],
  [{ key: '4' }, { key: '5' }, { key: '6' }, { key: '-' }],
  [{ key: '1' }, { key: '2' }, { key: '3' }, { key: '+' }],
  [{ key: '0', span: 2 }, { key: '.' }, { key: '=' }],
];

function evalExpr(expr: string): number {
  try {
    const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\s/g, '');
    if (!/^[\d+\-*/().]+$/.test(s)) return NaN;
    const n = new Function(`return (${s})`);
    return n() as number;
  } catch {
    return NaN;
  }
}

// ─── CalculatorPopover ───────────────────────────────────────────────────────

interface CalculatorPopoverProps {
  /** Controlled open state (for shortcut-driven open). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render as trigger button (default) or children-only. */
  children?: React.ReactNode;
}

/**
 * Inline calculator popover. Triggered by header button or mod+= shortcut.
 */
export function CalculatorPopover({
  open: controlledOpen,
  onOpenChange,
  children,
}: CalculatorPopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [display, setDisplay] = useState('0');
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState<number | null>(null);

  const handleInput = useCallback(
    (key: string) => {
      if (key === 'C') {
        setDisplay('0');
        setPendingOp(null);
        setPrevValue(null);
        return;
      }
      if (key === '±') {
        setDisplay((d) => (d.startsWith('-') ? d.slice(1) : `-${d}`));
        return;
      }
      if (key === '%') {
        setDisplay((d) => String(Number(d) / 100));
        return;
      }
      if (['+', '-', '×', '÷'].includes(key)) {
        const num = Number(display);
        if (pendingOp !== null && prevValue !== null) {
          const result = evalExpr(`${prevValue} ${pendingOp} ${num}`);
          setDisplay(Number.isFinite(result) ? String(result) : 'Error');
        }
        setPrevValue(Number(display));
        setPendingOp(key);
        return;
      }
      if (key === '=') {
        if (pendingOp !== null && prevValue !== null) {
          const result = evalExpr(`${prevValue} ${pendingOp} ${display}`);
          setDisplay(Number.isFinite(result) ? String(result) : 'Error');
          setPendingOp(null);
          setPrevValue(null);
        }
        return;
      }
      if (key === '.') {
        if (display.includes('.')) return;
        setDisplay((d) => (d === '0' ? '0.' : d + '.'));
        return;
      }
      if (/\d/.test(key)) {
        setDisplay((d) => (d === '0' ? key : d + key));
      }
    },
    [display, pendingOp, prevValue],
  );

  const trigger = children ?? (
    <Button
      variant="ghost"
      size="icon-sm"
      className={ACTION_BTN}
      aria-label="Calculator"
    >
      <Calculator className={ICON} aria-hidden />
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Calculator (Ctrl+=)</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-64 p-2">
        <div className="font-mono text-right text-2xl tabular-nums mb-2 min-h-8 truncate">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-1">
          {CALC_BUTTONS.flatMap((row, ri) =>
            row.map(({ key, span }, ci) => (
              <Button
                key={`${ri}-${ci}-${key}`}
                variant={['=', 'C', '±', '%', '÷', '×', '-', '+'].includes(key) ? 'secondary' : 'outline'}
                size="sm"
                className={cn('font-mono', span === 2 && 'col-span-2')}
                onClick={() => handleInput(key)}
              >
                {key}
              </Button>
            )),
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
CalculatorPopover.displayName = 'CalculatorPopover';
