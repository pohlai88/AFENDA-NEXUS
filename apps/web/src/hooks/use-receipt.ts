'use client';

import { useState, useCallback } from 'react';
import type { CommandReceipt } from '@/lib/types';

interface UseReceiptReturn {
  receipt: CommandReceipt | null;
  showReceipt: (receipt: CommandReceipt) => void;
  clearReceipt: () => void;
  isOpen: boolean;
}

export function useReceipt(): UseReceiptReturn {
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);

  const showReceipt = useCallback((r: CommandReceipt) => {
    setReceipt(r);
  }, []);

  const clearReceipt = useCallback(() => {
    setReceipt(null);
  }, []);

  return {
    receipt,
    showReceipt,
    clearReceipt,
    isOpen: receipt !== null,
  };
}
