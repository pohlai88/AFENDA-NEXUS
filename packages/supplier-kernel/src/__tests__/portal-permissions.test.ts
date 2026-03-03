import { describe, expect, it } from 'vitest';

import {
  createPortalContext,
  type CreatePortalContextInput,
} from '../context/portal-request-context.js';
import {
  checkSoDConflict,
  hasPortalPermission,
  isRoleAtLeast,
  PORTAL_SOD_RULES,
  PortalPermissionError,
  PortalSoDViolationError,
  requireNoSoDConflict,
  requirePortalPermission,
} from '../permissions/portal-permissions.js';

describe('SP-1002: Portal Permissions', () => {
  const mkCtx = (role: CreatePortalContextInput['portalRole']) =>
    createPortalContext({
      tenantId: 't-1',
      supplierId: 's-1',
      portalUserId: 'u-1',
      entityIds: ['e-1'],
      portalRole: role,
      actorFingerprint: 'fp',
    });

  // ─── hasPortalPermission ────────────────────────────────────────────────

  describe('hasPortalPermission', () => {
    it('PORTAL_OWNER has INVOICE_SUBMIT', () => {
      expect(hasPortalPermission(mkCtx('PORTAL_OWNER'), 'INVOICE_SUBMIT')).toBe(true);
    });

    it('PORTAL_READONLY lacks INVOICE_SUBMIT', () => {
      expect(hasPortalPermission(mkCtx('PORTAL_READONLY'), 'INVOICE_SUBMIT')).toBe(false);
    });

    it('PORTAL_READONLY has INVOICE_READ', () => {
      expect(hasPortalPermission(mkCtx('PORTAL_READONLY'), 'INVOICE_READ')).toBe(true);
    });
  });

  // ─── requirePortalPermission ────────────────────────────────────────────

  describe('requirePortalPermission', () => {
    it('does not throw when permission exists', () => {
      expect(() => requirePortalPermission(mkCtx('PORTAL_OWNER'), 'USER_MANAGE')).not.toThrow();
    });

    it('throws PortalPermissionError when permission missing', () => {
      expect(() => requirePortalPermission(mkCtx('PORTAL_READONLY'), 'USER_MANAGE')).toThrow(
        PortalPermissionError
      );
    });

    it('error contains role and permission', () => {
      try {
        requirePortalPermission(mkCtx('PORTAL_READONLY'), 'USER_MANAGE');
        expect.fail('Should have thrown');
      } catch (e) {
        const err = e as PortalPermissionError;
        expect(err.role).toBe('PORTAL_READONLY');
        expect(err.requiredPermission).toBe('USER_MANAGE');
        expect(err.code).toBe('PORTAL_PERMISSION_DENIED');
      }
    });
  });

  // ─── SoD Rules ──────────────────────────────────────────────────────────

  describe('checkSoDConflict', () => {
    it('detects bankAccount propose/approve conflict', () => {
      const rule = checkSoDConflict('bankAccount', 'bank_account:propose', 'bank_account:approve');
      expect(rule).not.toBeNull();
      expect(rule?.entityType).toBe('bankAccount');
    });

    it('detects apiKey create/activate conflict', () => {
      const rule = checkSoDConflict('apiKey', 'api_key:create', 'api_key:activate');
      expect(rule).not.toBeNull();
    });

    it('detects case resolve/reopen conflict', () => {
      const rule = checkSoDConflict('case', 'case:resolve', 'case:reopen');
      expect(rule).not.toBeNull();
    });

    it('returns null for non-conflicting actions', () => {
      const rule = checkSoDConflict('bankAccount', 'bank_account:propose', 'bank_account:read');
      expect(rule).toBeNull();
    });

    it('works in reverse order', () => {
      const rule = checkSoDConflict('bankAccount', 'bank_account:approve', 'bank_account:propose');
      expect(rule).not.toBeNull();
    });
  });

  describe('requireNoSoDConflict', () => {
    it('does not throw for non-conflicting actions', () => {
      expect(() =>
        requireNoSoDConflict('bankAccount', 'bank_account:propose', 'bank_account:read', 'u-1')
      ).not.toThrow();
    });

    it('throws PortalSoDViolationError for conflicting actions', () => {
      expect(() =>
        requireNoSoDConflict('bankAccount', 'bank_account:propose', 'bank_account:approve', 'u-1')
      ).toThrow(PortalSoDViolationError);
    });
  });

  // ─── Role Hierarchy ─────────────────────────────────────────────────────

  describe('isRoleAtLeast', () => {
    it('PORTAL_OWNER >= PORTAL_OWNER', () => {
      expect(isRoleAtLeast('PORTAL_OWNER', 'PORTAL_OWNER')).toBe(true);
    });

    it('PORTAL_OWNER >= PORTAL_READONLY', () => {
      expect(isRoleAtLeast('PORTAL_OWNER', 'PORTAL_READONLY')).toBe(true);
    });

    it('PORTAL_READONLY < PORTAL_FINANCE', () => {
      expect(isRoleAtLeast('PORTAL_READONLY', 'PORTAL_FINANCE')).toBe(false);
    });

    it('PORTAL_OPERATIONS >= PORTAL_READONLY', () => {
      expect(isRoleAtLeast('PORTAL_OPERATIONS', 'PORTAL_READONLY')).toBe(true);
    });
  });

  // ─── Constants ──────────────────────────────────────────────────────────

  describe('constants', () => {
    it('PORTAL_SOD_RULES has 3 entries', () => {
      expect(PORTAL_SOD_RULES).toHaveLength(3);
    });
  });
});
