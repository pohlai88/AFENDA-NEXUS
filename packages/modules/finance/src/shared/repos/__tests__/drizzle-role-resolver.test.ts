/**
 * Regression tests for DrizzleRoleResolver.
 *
 * Verifies that resolveRoles() gracefully returns [] when the
 * neon_auth.member table doesn't exist (Postgres 42P01), rather
 * than letting the error propagate as a 500.
 */
import { describe, it, expect, vi } from 'vitest';
import { DrizzleRoleResolver, isMissingRelation } from '../drizzle-role-resolver.js';

// ─── isMissingRelation helper ───────────────────────────────────────────────

describe('isMissingRelation', () => {
  it('detects code 42P01 on the error itself', () => {
    expect(isMissingRelation({ code: '42P01', message: 'whatever' })).toBe(true);
  });

  it('detects code 42P01 on error.cause (DrizzleQueryError shape)', () => {
    const err = {
      message: 'Failed query: SELECT role FROM neon_auth.member ...',
      cause: { code: '42P01', message: 'relation "neon_auth.member" does not exist' },
    };
    expect(isMissingRelation(err)).toBe(true);
  });

  it('detects "does not exist" in error.message', () => {
    expect(isMissingRelation({ message: 'relation "neon_auth.member" does not exist' })).toBe(true);
  });

  it('detects "does not exist" in error.cause.message', () => {
    const err = {
      message: 'Failed query: ...',
      cause: { message: 'relation "neon_auth.member" does not exist' },
    };
    expect(isMissingRelation(err)).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isMissingRelation({ code: '23505', message: 'unique violation' })).toBe(false);
    expect(isMissingRelation(new Error('timeout'))).toBe(false);
    expect(isMissingRelation(null)).toBe(false);
    expect(isMissingRelation(undefined)).toBe(false);
  });
});

// ─── DrizzleRoleResolver.resolveRoles ───────────────────────────────────────

describe('DrizzleRoleResolver', () => {
  it('returns [] when neon_auth.member does not exist (42P01 on cause)', async () => {
    const tx = {
      execute: vi.fn().mockRejectedValue(
        Object.assign(new Error('Failed query: SELECT role FROM neon_auth.member'), {
          cause: { code: '42P01', message: 'relation "neon_auth.member" does not exist' },
        })
      ),
    };

    const resolver = new DrizzleRoleResolver(tx as any);
    const roles = await resolver.resolveRoles('tenant-1', 'user-1');
    expect(roles).toEqual([]);
  });

  it('returns [] when neon_auth.member does not exist (42P01 on error)', async () => {
    const tx = {
      execute: vi.fn().mockRejectedValue(
        Object.assign(new Error('relation "neon_auth.member" does not exist'), {
          code: '42P01',
        })
      ),
    };

    const resolver = new DrizzleRoleResolver(tx as any);
    const roles = await resolver.resolveRoles('tenant-1', 'user-1');
    expect(roles).toEqual([]);
  });

  it('re-throws unrelated errors', async () => {
    const tx = {
      execute: vi.fn().mockRejectedValue(new Error('connection refused')),
    };

    const resolver = new DrizzleRoleResolver(tx as any);
    await expect(resolver.resolveRoles('t', 'u')).rejects.toThrow('connection refused');
  });

  it('returns mapped roles when table exists and rows are returned', async () => {
    const tx = {
      execute: vi.fn().mockResolvedValue({ rows: [{ role: 'admin' }] }),
    };

    const resolver = new DrizzleRoleResolver(tx as any);
    const roles = await resolver.resolveRoles('t', 'u');
    expect(roles.length).toBeGreaterThan(0);
    expect(roles[0].name).toBe('admin');
  });

  it('returns [] when table exists but no rows match', async () => {
    const tx = {
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const resolver = new DrizzleRoleResolver(tx as any);
    const roles = await resolver.resolveRoles('t', 'u');
    expect(roles).toEqual([]);
  });
});
