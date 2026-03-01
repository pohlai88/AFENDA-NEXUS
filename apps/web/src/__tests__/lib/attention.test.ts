import type {
  AttentionItem,
  AttentionSummary,
  AttentionSeverity,
} from '@/lib/attention/attention.types';
import { SEVERITY_ORDER } from '@/lib/attention/attention.types';

describe('Attention Types', () => {
  it('severity order sorts critical first, then warning, then info', () => {
    const severities: AttentionSeverity[] = ['info', 'critical', 'warning'];
    const sorted = [...severities].sort(
      (a, b) => SEVERITY_ORDER[a] - SEVERITY_ORDER[b],
    );
    expect(sorted).toEqual(['critical', 'warning', 'info']);
  });

  it('AttentionItem shape is well-formed', () => {
    const item: AttentionItem = {
      id: 'overdue-payables',
      severity: 'critical',
      title: 'Overdue Payables',
      count: 3,
      href: '/finance/accounts-payable/payables?filter=overdue',
      reason: '3 AP invoices are past due date',
      evidence: {
        overdueIds: ['INV-001', 'INV-003', 'INV-007'],
        oldestDueDate: '2026-01-15',
      },
      lastComputedAt: new Date(),
    };

    expect(item.id).toBe('overdue-payables');
    expect(item.severity).toBe('critical');
    expect(item.count).toBe(3);
    expect(typeof item.reason).toBe('string');
    expect(item.evidence).toBeDefined();
    expect(item.lastComputedAt).toBeInstanceOf(Date);
  });

  it('AttentionSummary aggregates correctly', () => {
    const items: AttentionItem[] = [
      {
        id: 'overdue',
        severity: 'critical',
        title: 'Overdue',
        count: 3,
        href: '/finance',
        reason: '3 overdue',
        evidence: {},
        lastComputedAt: new Date(),
      },
      {
        id: 'pending',
        severity: 'warning',
        title: 'Pending',
        count: 2,
        href: '/finance',
        reason: '2 pending',
        evidence: {},
        lastComputedAt: new Date(),
      },
      {
        id: 'unreconciled',
        severity: 'info',
        title: 'Unreconciled',
        count: 5,
        href: '/finance',
        reason: '5 unmatched',
        evidence: {},
        lastComputedAt: new Date(),
      },
    ];

    const summary: AttentionSummary = {
      total: items.reduce((sum, i) => sum + i.count, 0),
      critical: items.filter((i) => i.severity === 'critical').length,
      warning: items.filter((i) => i.severity === 'warning').length,
      info: items.filter((i) => i.severity === 'info').length,
      items,
    };

    expect(summary.total).toBe(10);
    expect(summary.critical).toBe(1);
    expect(summary.warning).toBe(1);
    expect(summary.info).toBe(1);
    expect(summary.items).toHaveLength(3);
  });
});
