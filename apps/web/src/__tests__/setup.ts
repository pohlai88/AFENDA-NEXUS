import '@testing-library/jest-dom/vitest';
import 'jest-axe/extend-expect';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Stub window.matchMedia for next-themes and responsive hooks (jsdom lacks it)
// Uses a plain function (not vi.fn) so restoreMocks doesn't clear it between tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
