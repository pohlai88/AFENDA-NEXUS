import { deriveBreadcrumbs } from '@/lib/breadcrumbs/auto-breadcrumbs';

describe('deriveBreadcrumbs', () => {
  it('returns empty array for root path', () => {
    expect(deriveBreadcrumbs('/')).toEqual([]);
  });

  it('strips route groups like (shell)', () => {
    const result = deriveBreadcrumbs('/(shell)/finance/journals');
    expect(result).toEqual([
      { label: 'Finance', href: '/finance' },
      { label: 'Journal Entries', href: undefined },
    ]);
  });

  it('maps known segments to human-readable labels', () => {
    const result = deriveBreadcrumbs('/finance/accounts');
    expect(result).toEqual([
      { label: 'Finance', href: '/finance' },
      { label: 'Chart of Accounts', href: undefined },
    ]);
  });

  it('skips UUID dynamic segments', () => {
    const result = deriveBreadcrumbs(
      '/finance/journals/8f3a1234-5678-9abc-def0-123456789abc',
    );
    // UUID is skipped — journals is the last visible crumb
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: 'Finance', href: '/finance' });
    expect(result[1]!.label).toBe('Journal Entries');
    // No UUID crumb present
    const labels = result.map((c) => c.label);
    expect(labels.every((l) => !/^[0-9a-f]{8,}/.test(l))).toBe(true);
  });

  it('title-cases unknown segments with hyphens', () => {
    const result = deriveBreadcrumbs('/finance/some-unknown-page');
    expect(result[1]).toEqual({
      label: 'Some Unknown Page',
      href: undefined,
    });
  });

  it('limits breadcrumbs to maxVisible (default 4)', () => {
    const result = deriveBreadcrumbs('/finance/payables/suppliers/edit/items');
    expect(result.length).toBeLessThanOrEqual(4);
  });

  it('applies pageBreadcrumb override to the last segment', () => {
    // pageBreadcrumb applies to the last raw segment — when UUID is last,
    // the override attaches to the last visible crumb
    const result = deriveBreadcrumbs(
      '/finance/journals',
      undefined,
      { pageBreadcrumb: 'Journal #REF-001' },
    );
    const last = result[result.length - 1];
    expect(last?.label).toBe('Journal #REF-001');
  });

  it('handles multi-level finance paths', () => {
    const result = deriveBreadcrumbs('/finance/banking/reconcile');
    expect(result).toEqual([
      { label: 'Finance', href: '/finance' },
      { label: 'Banking', href: '/finance/banking' },
      { label: 'Reconcile', href: undefined },
    ]);
  });

  it('handles settings paths', () => {
    const result = deriveBreadcrumbs('/settings/organization');
    expect(result).toEqual([
      { label: 'Settings', href: '/settings' },
      { label: 'Organization', href: undefined },
    ]);
  });

  it('strips multiple route groups', () => {
    const result = deriveBreadcrumbs('/(shell)/(auth)/settings');
    expect(result).toEqual([
      { label: 'Settings', href: undefined },
    ]);
  });
});
