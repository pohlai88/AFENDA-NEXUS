import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import { EmptyState } from './empty-state';
import { CONSTRAINT_SLOTS } from './empty-state.types';
import type { EmptyStateConstraint } from './empty-state.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** All 6 constraint tiers. */
const ALL_TIERS: EmptyStateConstraint[] = ['1x1', '1x2', '2x1', '2x2', 'table', 'page'];

/** Tiers that hide description. */
const NO_DESC_TIERS: EmptyStateConstraint[] = ALL_TIERS.filter(
  (t) => !CONSTRAINT_SLOTS[t].description
);

/** Tiers that hide action. */
const NO_ACTION_TIERS: EmptyStateConstraint[] = ALL_TIERS.filter(
  (t) => !CONSTRAINT_SLOTS[t].action
);

/** Tiers where border-0 is applied (embedded containers). */
const BORDERLESS_TIERS: EmptyStateConstraint[] = ['1x1', '1x2'];

/** Tiers with dashed border. */
const BORDERED_TIERS: EmptyStateConstraint[] = ['2x1', '2x2', 'table', 'page'];

/** Tiers where animation is always disabled. */
const ANIMATION_OFF_TIERS: EmptyStateConstraint[] = ['1x1', '1x2'];

// ─── Slot Visibility ─────────────────────────────────────────────────────────

describe('EmptyState constraint tiers', () => {
  describe.each(ALL_TIERS)('constraint="%s"', (tier) => {
    it('always renders title', () => {
      render(
        <EmptyState
          constraint={tier}
          title="Test Title"
          description="Test desc"
          action={<button type="button">CTA</button>}
          animate={false}
        />
      );
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it(`${CONSTRAINT_SLOTS[tier as EmptyStateConstraint].description ? 'renders' : 'hides'} description`, () => {
      render(
        <EmptyState constraint={tier} title="Title" description="Desc text" animate={false} />
      );
      if (CONSTRAINT_SLOTS[tier].description) {
        expect(screen.getByText('Desc text')).toBeInTheDocument();
      } else {
        expect(screen.queryByText('Desc text')).not.toBeInTheDocument();
      }
    });

    it(`${CONSTRAINT_SLOTS[tier as EmptyStateConstraint].action ? 'renders' : 'hides'} action`, () => {
      render(
        <EmptyState
          constraint={tier}
          title="Title"
          action={<button type="button">Action CTA</button>}
          animate={false}
        />
      );
      if (CONSTRAINT_SLOTS[tier].action) {
        expect(screen.getByRole('button', { name: 'Action CTA' })).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('button', { name: 'Action CTA' })).not.toBeInTheDocument();
      }
    });

    it('passes axe accessibility checks', async () => {
      const { container } = render(
        <EmptyState
          constraint={tier}
          title="Accessible Title"
          description="Accessible description"
          animate={false}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ─── Border Policy ───────────────────────────────────────────────────────────

describe('EmptyState border policy', () => {
  it.each(BORDERLESS_TIERS)('constraint="%s" has border-0 (no dashed border)', (tier) => {
    const { container } = render(<EmptyState constraint={tier} title="T" animate={false} />);
    const root = container.firstElementChild!;
    expect(root.className).toContain('border-0');
    expect(root.className).not.toContain('border-dashed');
  });

  it.each(BORDERED_TIERS)('constraint="%s" has border border-dashed', (tier) => {
    const { container } = render(<EmptyState constraint={tier} title="T" animate={false} />);
    const root = container.firstElementChild!;
    expect(root.className).toContain('border');
    expect(root.className).toContain('border-dashed');
  });
});

// ─── Deprecation Bridge ──────────────────────────────────────────────────────

describe('EmptyState deprecation bridge', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  it('size="sm" triggers console.warn and maps to 1x1', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<EmptyState size="sm" title="Deprecated" animate={false} />);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`size` is deprecated'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('size="sm" → constraint="1x1"'));
    warnSpy.mockRestore();
  });

  it('size="md" maps to 2x2', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <EmptyState
        size="md"
        title="T"
        description="D"
        action={<button type="button">CTA</button>}
        animate={false}
      />
    );
    // 2x2 shows all slots
    expect(screen.getByText('D')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CTA' })).toBeInTheDocument();
    warnSpy.mockRestore();
  });

  it('size="lg" maps to page', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<EmptyState size="lg" title="T" animate={false} />);
    const root = container.firstElementChild!;
    // page tier uses py-16 gap-4
    expect(root.className).toContain('py-16');
    warnSpy.mockRestore();
  });

  it('constraint takes precedence over size', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <EmptyState constraint="1x1" size="lg" title="T" animate={false} />
    );
    const root = container.firstElementChild!;
    // 1x1 uses py-3, not py-16
    expect(root.className).toContain('py-3');
    expect(root.className).not.toContain('py-16');
    // no deprecation warn since constraint was provided
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ─── Default Constraint ──────────────────────────────────────────────────────

describe('EmptyState default constraint', () => {
  it('defaults to 2x2 when neither constraint nor size is provided', () => {
    const { container } = render(<EmptyState title="Default" animate={false} />);
    const root = container.firstElementChild!;
    // 2x2 uses py-8 gap-3
    expect(root.className).toContain('py-8');
    expect(root.className).toContain('gap-3');
  });
});

// ─── Animation Policy ────────────────────────────────────────────────────────

describe('EmptyState animation policy', () => {
  it.each(ANIMATION_OFF_TIERS)(
    'constraint="%s" renders static div even with animate=true',
    (tier) => {
      const { container } = render(<EmptyState constraint={tier} title="No anim" animate={true} />);
      const root = container.firstElementChild!;
      // Static div has role="status" but no framer-motion data attributes
      expect(root.getAttribute('role')).toBe('status');
      expect(root.getAttribute('style')).toBeNull();
    }
  );
});

// ─── CONSTRAINT_SLOTS Integrity ──────────────────────────────────────────────

describe('CONSTRAINT_SLOTS', () => {
  it('has entries for all 6 tiers', () => {
    for (const tier of ALL_TIERS) {
      expect(CONSTRAINT_SLOTS[tier]).toBeDefined();
      expect(CONSTRAINT_SLOTS[tier]).toHaveProperty('icon');
      expect(CONSTRAINT_SLOTS[tier]).toHaveProperty('title');
      expect(CONSTRAINT_SLOTS[tier]).toHaveProperty('description');
      expect(CONSTRAINT_SLOTS[tier]).toHaveProperty('action');
    }
  });

  it('icon and title are always true for every tier', () => {
    for (const tier of ALL_TIERS) {
      expect(CONSTRAINT_SLOTS[tier].icon).toBe(true);
      expect(CONSTRAINT_SLOTS[tier].title).toBe(true);
    }
  });
});
