import { renderHook, act } from '@testing-library/react';
import { useReceipt } from '@/hooks/use-receipt';
import type { CommandReceipt } from '@/lib/types';

const mockReceipt: CommandReceipt = {
  commandId: 'cmd-001',
  idempotencyKey: 'idem-key-001',
  resultRef: 'JE-2024-0001',
  completedAt: '2024-06-15T10:30:00Z',
  auditRef: 'audit-ref-001',
};

describe('useReceipt', () => {
  it('starts with null receipt and isOpen false', () => {
    const { result } = renderHook(() => useReceipt());
    expect(result.current.receipt).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('showReceipt sets the receipt and isOpen to true', () => {
    const { result } = renderHook(() => useReceipt());

    act(() => {
      result.current.showReceipt(mockReceipt);
    });

    expect(result.current.receipt).toEqual(mockReceipt);
    expect(result.current.isOpen).toBe(true);
  });

  it('clearReceipt resets receipt to null and isOpen to false', () => {
    const { result } = renderHook(() => useReceipt());

    act(() => {
      result.current.showReceipt(mockReceipt);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.clearReceipt();
    });
    expect(result.current.receipt).toBeNull();
    expect(result.current.isOpen).toBe(false);
  });

  it('showReceipt can be called with different receipts', () => {
    const { result } = renderHook(() => useReceipt());
    const anotherReceipt: CommandReceipt = {
      ...mockReceipt,
      commandId: 'cmd-002',
      resultRef: 'JE-2024-0002',
    };

    act(() => {
      result.current.showReceipt(mockReceipt);
    });
    expect(result.current.receipt?.resultRef).toBe('JE-2024-0001');

    act(() => {
      result.current.showReceipt(anotherReceipt);
    });
    expect(result.current.receipt?.resultRef).toBe('JE-2024-0002');
  });

  it('maintains referential stability of callbacks', () => {
    const { result, rerender } = renderHook(() => useReceipt());

    const showRef1 = result.current.showReceipt;
    const clearRef1 = result.current.clearReceipt;

    rerender();

    expect(result.current.showReceipt).toBe(showRef1);
    expect(result.current.clearReceipt).toBe(clearRef1);
  });
});
