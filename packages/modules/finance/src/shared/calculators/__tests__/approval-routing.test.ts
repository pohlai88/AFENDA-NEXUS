import { describe, it, expect } from 'vitest';
import { routeApproval } from '../approval-routing.js';
import type { ApprovalPolicy } from '../../entities/approval-policy.js';

const basePolicy: ApprovalPolicy = {
  id: 'pol-1',
  tenantId: 't1',
  companyId: null,
  entityType: 'journal',
  name: 'Journal Approval',
  isActive: true,
  rules: [
    {
      condition: { field: 'amount', operator: 'gte', value: '100000' },
      chain: [
        { approverType: 'role', approverValue: 'cfo', mode: 'sequential' },
        { approverType: 'role', approverValue: 'ceo', mode: 'sequential' },
      ],
    },
    {
      condition: { field: 'amount', operator: 'gte', value: '10000' },
      chain: [{ approverType: 'role', approverValue: 'finance_manager', mode: 'sequential' }],
    },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('routeApproval', () => {
  it('returns null when no policies exist', () => {
    expect(routeApproval([], 'journal', { amount: 50000 })).toBeNull();
  });

  it('returns null when no active policies match entity type', () => {
    expect(routeApproval([basePolicy], 'payment_run', { amount: 50000 })).toBeNull();
  });

  it('returns null when policy is inactive', () => {
    const inactive = { ...basePolicy, isActive: false };
    expect(routeApproval([inactive], 'journal', { amount: 50000 })).toBeNull();
  });

  it('returns null when no rule condition matches (below all thresholds)', () => {
    expect(routeApproval([basePolicy], 'journal', { amount: 5000 })).toBeNull();
  });

  it('matches first rule when amount >= 100000 (two-level chain)', () => {
    const chain = routeApproval([basePolicy], 'journal', { amount: 150000 });
    expect(chain).not.toBeNull();
    expect(chain).toHaveLength(2);
    expect(chain![0]!.approverValue).toBe('cfo');
    expect(chain![1]!.approverValue).toBe('ceo');
  });

  it('matches second rule when 10000 <= amount < 100000 (single-level chain)', () => {
    const chain = routeApproval([basePolicy], 'journal', { amount: 50000 });
    expect(chain).not.toBeNull();
    expect(chain).toHaveLength(1);
    expect(chain![0]!.approverValue).toBe('finance_manager');
  });

  it('first-match wins: amount=100000 matches rule 1 (gte 100000), not rule 2', () => {
    const chain = routeApproval([basePolicy], 'journal', { amount: 100000 });
    expect(chain).toHaveLength(2);
    expect(chain![0]!.approverValue).toBe('cfo');
  });

  it('handles string comparison for non-numeric fields', () => {
    const stringPolicy: ApprovalPolicy = {
      ...basePolicy,
      rules: [
        {
          condition: { field: 'department', operator: 'eq', value: 'legal' },
          chain: [{ approverType: 'userId', approverValue: 'user-legal-head', mode: 'sequential' }],
        },
      ],
    };
    const chain = routeApproval([stringPolicy], 'journal', { department: 'legal' });
    expect(chain).toHaveLength(1);
    expect(chain![0]!.approverValue).toBe('user-legal-head');
  });

  it('returns null when metadata field is missing', () => {
    expect(routeApproval([basePolicy], 'journal', {})).toBeNull();
  });

  it('evaluates policies in order — first matching policy wins', () => {
    const secondPolicy: ApprovalPolicy = {
      ...basePolicy,
      id: 'pol-2',
      rules: [
        {
          condition: { field: 'amount', operator: 'gte', value: '1' },
          chain: [{ approverType: 'role', approverValue: 'catch-all', mode: 'sequential' }],
        },
      ],
    };
    // basePolicy rule 1 matches first
    const chain = routeApproval([basePolicy, secondPolicy], 'journal', { amount: 200000 });
    expect(chain![0]!.approverValue).toBe('cfo');
  });

  it('falls through to second policy when first has no matching rules', () => {
    const lowThresholdPolicy: ApprovalPolicy = {
      ...basePolicy,
      id: 'pol-low',
      rules: [
        {
          condition: { field: 'amount', operator: 'gte', value: '1' },
          chain: [{ approverType: 'role', approverValue: 'catch-all', mode: 'sequential' }],
        },
      ],
    };
    // amount=5 doesn't match basePolicy (thresholds 10000/100000), falls to lowThresholdPolicy
    const chain = routeApproval([basePolicy, lowThresholdPolicy], 'journal', { amount: 5 });
    expect(chain).toHaveLength(1);
    expect(chain![0]!.approverValue).toBe('catch-all');
  });

  it('supports gt operator', () => {
    const gtPolicy: ApprovalPolicy = {
      ...basePolicy,
      rules: [
        {
          condition: { field: 'amount', operator: 'gt', value: '100' },
          chain: [{ approverType: 'role', approverValue: 'approver', mode: 'sequential' }],
        },
      ],
    };
    expect(routeApproval([gtPolicy], 'journal', { amount: 100 })).toBeNull();
    expect(routeApproval([gtPolicy], 'journal', { amount: 101 })).toHaveLength(1);
  });

  it('supports lt and lte operators', () => {
    const ltPolicy: ApprovalPolicy = {
      ...basePolicy,
      rules: [
        {
          condition: { field: 'priority', operator: 'lt', value: '3' },
          chain: [{ approverType: 'role', approverValue: 'urgent-approver', mode: 'sequential' }],
        },
      ],
    };
    expect(routeApproval([ltPolicy], 'journal', { priority: 2 })).toHaveLength(1);
    expect(routeApproval([ltPolicy], 'journal', { priority: 3 })).toBeNull();
  });
});
