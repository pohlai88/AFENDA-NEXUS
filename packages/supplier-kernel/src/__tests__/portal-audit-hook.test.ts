import { describe, expect, it } from 'vitest';

import { buildAuditEntry } from '../audit/portal-audit-hook.js';

describe('SP-1005: Audit Hook', () => {
  describe('buildAuditEntry', () => {
    it('creates entry with all fields', () => {
      const entry = buildAuditEntry({
        tenantId: 'tenant-1',
        actorId: 'user-1',
        actorType: 'SUPPLIER',
        action: 'INVOICE_SUBMIT',
        resource: 'supplier_invoice',
        resourceId: 'inv-123',
        metadata: { invoiceNumber: 'INV-2026-001' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(entry.tenantId).toBe('tenant-1');
      expect(entry.actorId).toBe('user-1');
      expect(entry.actorType).toBe('SUPPLIER');
      expect(entry.action).toBe('INVOICE_SUBMIT');
      expect(entry.resource).toBe('supplier_invoice');
      expect(entry.resourceId).toBe('inv-123');
      expect(entry.metadata).toEqual({ invoiceNumber: 'INV-2026-001' });
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
    });

    it('sets timestamp to current time', () => {
      const before = new Date();
      const entry = buildAuditEntry({
        tenantId: 't',
        actorId: 'a',
        actorType: 'BUYER',
        action: 'CASE_CREATE',
        resource: 'supplier_case',
      });
      const after = new Date();

      expect(entry.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('optional fields are undefined when not provided', () => {
      const entry = buildAuditEntry({
        tenantId: 't',
        actorId: 'a',
        actorType: 'SYSTEM',
        action: 'DAILY_ANCHOR',
        resource: 'proof_chain',
      });

      expect(entry.resourceId).toBeUndefined();
      expect(entry.metadata).toBeUndefined();
      expect(entry.ipAddress).toBeUndefined();
      expect(entry.userAgent).toBeUndefined();
    });
  });
});
