import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

// Mock next/navigation — must be before hook import
const mockPathname = vi.fn(() => '/finance/journals');
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock shell-persistence to avoid localStorage in tests
const mockRead = vi.fn((): unknown => []);
const mockWrite = vi.fn();
vi.mock('@/lib/shell/shell-persistence', () => ({
  readConveniencePrefs: () => mockRead(),
  writeConveniencePrefs: (...args: unknown[]) => mockWrite(...args),
}));

import { useRecentItems } from '@/hooks/use-recent-items';
import type { RecentItem } from '@/lib/shell/shell-preferences.types';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useRecentItems', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockRead.mockReturnValue([]);
    mockWrite.mockClear();
    mockPathname.mockReturnValue('/finance/journals');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initialises with empty recents from localStorage', () => {
    const { result } = renderHook(() => useRecentItems());
    expect(result.current.recents).toEqual([]);
  });

  it('initialises from existing localStorage data', () => {
    const stored: RecentItem[] = [
      { href: '/finance/journals', title: 'Journals', moduleId: 'finance', ts: 1000 },
    ];
    mockRead.mockReturnValue(stored);

    const { result } = renderHook(() => useRecentItems());
    expect(result.current.recents).toHaveLength(1);
    expect(result.current.recents[0]!.href).toBe('/finance/journals');
  });

  it('adds a recent item manually via addRecent', () => {
    const { result } = renderHook(() => useRecentItems());
    const item: RecentItem = {
      href: '/finance/accounts',
      title: 'Accounts',
      moduleId: 'finance',
      ts: Date.now(),
    };

    act(() => {
      result.current.addRecent(item);
    });

    expect(result.current.recents).toHaveLength(1);
    expect(result.current.recents[0]!.href).toBe('/finance/accounts');
    expect(mockWrite).toHaveBeenCalled();
  });

  it('deduplicates when the most recent entry matches', () => {
    const { result } = renderHook(() => useRecentItems());
    const item: RecentItem = {
      href: '/finance/accounts',
      title: 'Accounts',
      moduleId: 'finance',
      ts: Date.now(),
    };

    act(() => {
      result.current.addRecent(item);
    });

    // Adding same href again should NOT increase length
    act(() => {
      result.current.addRecent({ ...item, ts: Date.now() + 1 });
    });

    expect(result.current.recents).toHaveLength(1);
  });

  it('caps at 20 items (FIFO eviction)', () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addRecent({
          href: `/page/${i}`,
          title: `Page ${i}`,
          moduleId: 'test',
          ts: Date.now() + i,
        });
      }
    });

    expect(result.current.recents.length).toBeLessThanOrEqual(20);
  });

  it('clearRecent empties the list and writes to localStorage', () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecent({
        href: '/finance/accounts',
        title: 'Accounts',
        moduleId: 'finance',
        ts: Date.now(),
      });
    });
    expect(result.current.recents).toHaveLength(1);

    act(() => {
      result.current.clearRecent();
    });

    expect(result.current.recents).toHaveLength(0);
    expect(mockWrite).toHaveBeenCalledWith('recents', []);
  });

  it('getRecent returns current recents', () => {
    const { result } = renderHook(() => useRecentItems());

    act(() => {
      result.current.addRecent({
        href: '/finance/accounts',
        title: 'Accounts',
        moduleId: 'finance',
        ts: Date.now(),
      });
    });

    expect(result.current.getRecent()).toHaveLength(1);
    expect(result.current.getRecent()[0]!.href).toBe('/finance/accounts');
  });

  it('debounces automatic pathname tracking', () => {
    renderHook(() => useRecentItems());

    // Before debounce fires, nothing should be written
    expect(mockWrite).not.toHaveBeenCalled();

    // After debounce completes (1000ms), the pathname should be tracked
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    // The hook should have attempted to write after debounce
    // (the auto-track effect fires on mount with the initial pathname)
    expect(mockWrite).toHaveBeenCalled();
  });
});
