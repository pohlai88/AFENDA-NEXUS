import { renderHook, act } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockRead = vi.fn((): unknown => []);
const mockWrite = vi.fn();
vi.mock('@/lib/shell/shell-persistence', () => ({
  readConveniencePrefs: () => mockRead(),
  writeConveniencePrefs: (...args: unknown[]) => mockWrite(...args),
}));

import { useFavorites } from '@/hooks/use-favorites';
import type { FavoriteItem } from '@/lib/shell/shell-preferences.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFav(href: string, title = 'Test'): Omit<FavoriteItem, 'addedAt'> {
  return { href, title, moduleId: 'finance' };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('useFavorites', () => {
  beforeEach(() => {
    mockRead.mockReturnValue([]);
    mockWrite.mockClear();
  });

  it('initialises with empty favorites', () => {
    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toEqual([]);
  });

  it('initialises from existing localStorage data', () => {
    const stored: FavoriteItem[] = [
      { href: '/finance/journals', title: 'Journals', moduleId: 'finance', addedAt: 1000 },
    ];
    mockRead.mockReturnValue(stored);

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(1);
  });

  it('toggle adds a new favorite', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggle(makeFav('/finance/accounts', 'Accounts'));
    });

    expect(result.current.favorites).toHaveLength(1);
    expect(result.current.favorites[0]!.href).toBe('/finance/accounts');
    expect(result.current.favorites[0]!.addedAt).toBeGreaterThan(0);
    expect(mockWrite).toHaveBeenCalled();
  });

  it('toggle removes an existing favorite', () => {
    const stored: FavoriteItem[] = [
      { href: '/finance/accounts', title: 'Accounts', moduleId: 'finance', addedAt: 1000 },
    ];
    mockRead.mockReturnValue(stored);

    const { result } = renderHook(() => useFavorites());
    expect(result.current.favorites).toHaveLength(1);

    act(() => {
      result.current.toggle(makeFav('/finance/accounts'));
    });

    expect(result.current.favorites).toHaveLength(0);
    expect(mockWrite).toHaveBeenCalled();
  });

  it('isFavorite returns true for favorited href', () => {
    const stored: FavoriteItem[] = [
      { href: '/finance/accounts', title: 'Accounts', moduleId: 'finance', addedAt: 1000 },
    ];
    mockRead.mockReturnValue(stored);

    const { result } = renderHook(() => useFavorites());
    expect(result.current.isFavorite('/finance/accounts')).toBe(true);
    expect(result.current.isFavorite('/finance/journals')).toBe(false);
  });

  it('caps at 20 favorites', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.toggle(makeFav(`/page/${i}`, `Page ${i}`));
      }
    });

    expect(result.current.favorites.length).toBeLessThanOrEqual(20);
  });

  it('getFavorites returns current list', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggle(makeFav('/finance/accounts', 'Accounts'));
      result.current.toggle(makeFav('/finance/journals', 'Journals'));
    });

    const list = result.current.getFavorites();
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('prepends new favorites (most-recent first)', () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggle(makeFav('/first', 'First'));
    });
    act(() => {
      result.current.toggle(makeFav('/second', 'Second'));
    });

    expect(result.current.favorites[0]!.href).toBe('/second');
    expect(result.current.favorites[1]!.href).toBe('/first');
  });
});
