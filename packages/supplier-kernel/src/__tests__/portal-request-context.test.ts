import { describe, expect, it } from 'vitest';

import {
  ACTOR_TYPES,
  BUYER_PORTAL_ROLES,
  createPortalContext,
  derivePermissions,
  PORTAL_PERMISSIONS,
  PORTAL_ROLES,
  type CreatePortalContextInput,
  type PortalRole,
} from '../context/portal-request-context.js';

describe('SP-1010: PortalRequestContext', () => {
  const baseInput: CreatePortalContextInput = {
    tenantId: 'tenant-1',
    supplierId: 'supplier-1',
    portalUserId: 'user-1',
    entityIds: ['entity-1', 'entity-2'],
    portalRole: 'PORTAL_FINANCE',
    actorFingerprint: 'abc123',
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  };

  // ─── createPortalContext ────────────────────────────────────────────────

  describe('createPortalContext', () => {
    it('creates a frozen context', () => {
      const ctx = createPortalContext(baseInput);
      expect(Object.isFrozen(ctx)).toBe(true);
    });

    it('copies all fields correctly', () => {
      const ctx = createPortalContext(baseInput);
      expect(ctx.tenantId).toBe('tenant-1');
      expect(ctx.supplierId).toBe('supplier-1');
      expect(ctx.portalUserId).toBe('user-1');
      expect(ctx.portalRole).toBe('PORTAL_FINANCE');
      expect(ctx.actorFingerprint).toBe('abc123');
      expect(ctx.idempotencyKey).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('freezes entityIds', () => {
      const ctx = createPortalContext(baseInput);
      expect(Object.isFrozen(ctx.entityIds)).toBe(true);
    });

    it('freezes permissions', () => {
      const ctx = createPortalContext(baseInput);
      expect(Object.isFrozen(ctx.permissions)).toBe(true);
    });

    it('derives permissions from role', () => {
      const ctx = createPortalContext(baseInput);
      expect(ctx.permissions.length).toBeGreaterThan(0);
      expect(ctx.permissions).toEqual(derivePermissions('PORTAL_FINANCE'));
    });

    it('works without idempotencyKey', () => {
      const { idempotencyKey: _, ...inputNoKey } = baseInput;
      const ctx = createPortalContext(inputNoKey);
      expect(ctx.idempotencyKey).toBeUndefined();
    });
  });

  // ─── derivePermissions ──────────────────────────────────────────────────

  describe('derivePermissions', () => {
    it('PORTAL_OWNER gets all permissions', () => {
      const perms = derivePermissions('PORTAL_OWNER');
      expect(perms).toHaveLength(PORTAL_PERMISSIONS.length);
      for (const p of PORTAL_PERMISSIONS) {
        expect(perms).toContain(p);
      }
    });

    it('PORTAL_READONLY cannot submit invoices', () => {
      const perms = derivePermissions('PORTAL_READONLY');
      expect(perms).not.toContain('INVOICE_SUBMIT');
    });

    it('PORTAL_READONLY can read invoices', () => {
      const perms = derivePermissions('PORTAL_READONLY');
      expect(perms).toContain('INVOICE_READ');
    });

    it('PORTAL_FINANCE can submit invoices', () => {
      const perms = derivePermissions('PORTAL_FINANCE');
      expect(perms).toContain('INVOICE_SUBMIT');
    });

    it('PORTAL_OPERATIONS cannot manage bank accounts', () => {
      const perms = derivePermissions('PORTAL_OPERATIONS');
      expect(perms).not.toContain('BANK_ACCOUNT_MANAGE');
    });

    it('each role produces non-empty permission set', () => {
      for (const role of PORTAL_ROLES) {
        const perms = derivePermissions(role);
        expect(perms.length).toBeGreaterThan(0);
      }
    });

    it('permission sets are hierarchical (OWNER ⊇ FINANCE, OWNER ⊇ OPS)', () => {
      const ownerPerms = new Set(derivePermissions('PORTAL_OWNER'));
      const financePerms = new Set(derivePermissions('PORTAL_FINANCE'));
      const opsPerms = new Set(derivePermissions('PORTAL_OPERATIONS'));

      // finance ⊆ owner
      for (const p of financePerms) expect(ownerPerms.has(p)).toBe(true);
      // ops ⊆ owner
      for (const p of opsPerms) expect(ownerPerms.has(p)).toBe(true);
    });

    it('PORTAL_READONLY is a subset of PORTAL_OWNER', () => {
      const ownerPerms = new Set(derivePermissions('PORTAL_OWNER'));
      const readonlyPerms = new Set(derivePermissions('PORTAL_READONLY'));
      for (const p of readonlyPerms) expect(ownerPerms.has(p)).toBe(true);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('PORTAL_ROLES has 4 entries', () => {
      expect(PORTAL_ROLES).toHaveLength(4);
    });

    it('BUYER_PORTAL_ROLES has 3 entries', () => {
      expect(BUYER_PORTAL_ROLES).toHaveLength(3);
    });

    it('PORTAL_PERMISSIONS has 20 entries', () => {
      expect(PORTAL_PERMISSIONS).toHaveLength(20);
    });

    it('ACTOR_TYPES has 3 entries', () => {
      expect(ACTOR_TYPES).toHaveLength(3);
    });
  });
});
