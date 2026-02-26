import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useIsMobile } from '@/hooks/use-media-query';

// The matchMedia mock is already set up in __tests__/setup.ts

describe('useMediaQuery', () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;

  beforeEach(() => {
    listeners = new Map();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.set(query, handler);
        }),
        removeEventListener: vi.fn((_event: string, _handler: (e: MediaQueryListEvent) => void) => {
          listeners.delete(query);
        }),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('returns false initially when query does not match', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('returns true when query matches initially', () => {
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn((_e: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.set(query, handler);
      }),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('updates when media query changes', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    // Simulate the media query starting to match
    const handler = listeners.get('(max-width: 768px)');
    if (handler) {
      act(() => {
        handler({ matches: true } as MediaQueryListEvent);
      });
    }
    expect(result.current).toBe(true);
  });

  it('cleans up listener on unmount', () => {
    const removeEventListener = vi.fn();
    (window.matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});

describe('useIsMobile', () => {
  it('uses the 768px breakpoint query', () => {
    const matchMediaSpy = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: matchMediaSpy,
    });

    renderHook(() => useIsMobile());
    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 768px)');
  });
});
