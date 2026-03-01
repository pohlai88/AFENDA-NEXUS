declare module 'jest-axe' {
  export function axe(
    container: Element | Document,
    options?: Record<string, unknown>,
  ): Promise<unknown>;
  export const toHaveNoViolations: Record<string, unknown>;
  export function configureAxe(
    options?: Record<string, unknown>,
  ): typeof axe;
}

// Augment vitest matchers so `expect(results).toHaveNoViolations()` compiles
import 'vitest';
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}
