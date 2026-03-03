/**
 * Phase 1.1.7: Supplier Invitation Flow service unit tests (CAP-INV).
 *
 * Tests all 4 service functions:
 *   1. sendInvitation — buyer sends magic link invitation
 *   2. acceptInvitation — supplier accepts via token (creates account)
 *   3. revokeInvitation — buyer revokes pending invitation
 *   4. listInvitations — buyer lists sent invitations
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ok } from '@afenda/core';
import {
  sendInvitation,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
  type InvitationServiceDeps,
  type Invitation,
  type IInvitationRepo,
} from './supplier-portal-invitation';

// ─── Mock Factories ─────────────────────────────────────────────────────────

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const BUYER_USER_ID = '00000000-0000-0000-0000-000000000002';
const SUPPLIER_ID = '00000000-0000-0000-0000-000000000003';
const INVITATION_ID = '00000000-0000-0000-0000-000000000010';
const VALID_TOKEN = 'a'.repeat(64); // 64-char hex token

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    id: INVITATION_ID,
    tenantId: TENANT_ID,
    email: 'supplier@example.com',
    supplierName: 'Acme Corp',
    token: VALID_TOKEN,
    tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'PENDING',
    sentAt: new Date(),
    acceptedAt: null,
    revokedAt: null,
    supplierId: null,
    invitedBy: BUYER_USER_ID,
    invitationMessage: 'Welcome to our supplier portal!',
    proofChainHead: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeDeps(overrides: Partial<InvitationServiceDeps> = {}): InvitationServiceDeps {
  const invitationRepo: IInvitationRepo = {
    findByToken: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    create: vi.fn().mockImplementation(async (data) => data),
    update: vi.fn().mockImplementation(async (id, data) => ({
      ...makeInvitation(),
      id,
      ...data,
    })),
  };

  return {
    invitationRepo,
    supplierRepo: {
      create: vi.fn().mockResolvedValue(
        ok({
          id: SUPPLIER_ID,
          tenantId: TENANT_ID,
          code: 'SUP-123',
          name: 'Acme Corp',
          remittanceEmail: 'supplier@example.com',
        })
      ),
      findByEmail: vi.fn().mockResolvedValue(null),
    } as any,
    outboxWriter: {
      write: vi.fn().mockResolvedValue(undefined),
    } as any,
    proofChainWriter: {
      write: vi.fn().mockResolvedValue({ contentHash: 'proof-hash-123' }),
    } as any,
    ...overrides,
  };
}

// ─── Tests: sendInvitation ──────────────────────────────────────────────────

describe('sendInvitation', () => {
  it('creates invitation with secure token and correct expiry', async () => {
    const deps = makeDeps();
    const result = await sendInvitation(
      {
        tenantId: TENANT_ID,
        email: 'new-supplier@example.com',
        supplierName: 'New Corp',
        invitedBy: BUYER_USER_ID,
        invitationMessage: 'Looking forward to working together',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('new-supplier@example.com');
      expect(result.value.supplierName).toBe('New Corp');
      expect(result.value.status).toBe('PENDING');
      expect(result.value.token).toHaveLength(64); // Hex string from 32 bytes
      expect(result.value.invitedBy).toBe(BUYER_USER_ID);

      // Token should expire ~7 days from now
      const expiryDiff = result.value.tokenExpiresAt.getTime() - Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      expect(expiryDiff).toBeGreaterThan(sevenDaysMs - 60000); // Within 1 minute
      expect(expiryDiff).toBeLessThan(sevenDaysMs + 60000);
    }
  });

  it('emits SUPPLIER_INVITED outbox event', async () => {
    const deps = makeDeps();
    await sendInvitation(
      {
        tenantId: TENANT_ID,
        email: 'supplier@example.com',
        supplierName: 'Acme Corp',
        invitedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        eventType: 'SUPPLIER_INVITED',
        payload: expect.objectContaining({
          email: 'supplier@example.com',
          supplierName: 'Acme Corp',
        }),
      })
    );
  });

  it('writes proof chain entry for invitation sent', async () => {
    const deps = makeDeps();
    await sendInvitation(
      {
        tenantId: TENANT_ID,
        email: 'supplier@example.com',
        supplierName: 'Acme Corp',
        invitedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(deps.proofChainWriter?.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PORTAL_INVITATION_SENT',
        actorId: BUYER_USER_ID,
      }),
      undefined
    );
  });

  it('normalizes email to lowercase', async () => {
    const deps = makeDeps();
    const result = await sendInvitation(
      {
        tenantId: TENANT_ID,
        email: 'SUPPLIER@EXAMPLE.COM',
        supplierName: 'Acme Corp',
        invitedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('supplier@example.com');
    }
  });
});

// ─── Tests: acceptInvitation ────────────────────────────────────────────────

describe('acceptInvitation', () => {
  it('creates supplier account and updates invitation status', async () => {
    const invitation = makeInvitation();
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(invitation);

    const result = await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.supplierId).toBe(SUPPLIER_ID);
      expect(result.value.supplierName).toBe('Acme Corp');
      expect(result.value.email).toBe('supplier@example.com');
      expect(result.value.onboardingRedirectUrl).toContain('/portal/onboarding');
    }

    // Verify supplier creation
    expect(deps.supplierRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        name: 'Acme Corp',
        remittanceEmail: 'supplier@example.com',
      })
    );

    // Verify invitation status update
    expect(deps.invitationRepo.update).toHaveBeenCalledWith(
      INVITATION_ID,
      expect.objectContaining({
        status: 'ACCEPTED',
        supplierId: SUPPLIER_ID,
      })
    );
  });

  it('returns error for invalid token', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(null);

    const result = await acceptInvitation({ token: 'invalid-token' }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('ValidationError');
      expect(result.error.message).toContain('Invalid or expired');
    }
  });

  it('returns error for expired token', async () => {
    const expiredInvitation = makeInvitation({
      tokenExpiresAt: new Date(Date.now() - 1000), // 1 second ago
    });
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(expiredInvitation);

    const result = await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('expired');
    }

    // Verify invitation auto-expired
    expect(deps.invitationRepo.update).toHaveBeenCalledWith(
      INVITATION_ID,
      expect.objectContaining({ status: 'EXPIRED' })
    );
  });

  it('returns error for already accepted invitation', async () => {
    const acceptedInvitation = makeInvitation({
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      supplierId: SUPPLIER_ID,
    });
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(acceptedInvitation);

    const result = await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('already accepted');
    }
  });

  it('returns error for revoked invitation', async () => {
    const revokedInvitation = makeInvitation({
      status: 'REVOKED',
      revokedAt: new Date(),
    });
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(revokedInvitation);

    const result = await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('already revoked');
    }
  });

  it('emits SUPPLIER_CREATED event after acceptance', async () => {
    const invitation = makeInvitation();
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(invitation);

    await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(deps.outboxWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        eventType: 'SUPPLIER_CREATED',
        payload: expect.objectContaining({
          supplierId: SUPPLIER_ID,
          email: 'supplier@example.com',
        }),
      })
    );
  });

  it('writes proof chain entry for acceptance', async () => {
    const invitation = makeInvitation();
    const deps = makeDeps();
    (deps.invitationRepo.findByToken as any).mockResolvedValue(invitation);

    await acceptInvitation({ token: VALID_TOKEN }, deps);

    expect(deps.proofChainWriter?.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PORTAL_INVITATION_ACCEPTED',
        actorId: SUPPLIER_ID,
      }),
      undefined
    );
  });
});

// ─── Tests: revokeInvitation ────────────────────────────────────────────────

describe('revokeInvitation', () => {
  it('revokes pending invitation successfully', async () => {
    const invitation = makeInvitation();
    const deps = makeDeps();
    (deps.invitationRepo.findById as any).mockResolvedValue(invitation);

    const result = await revokeInvitation(
      {
        tenantId: TENANT_ID,
        invitationId: INVITATION_ID,
        revokedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('REVOKED');
      expect(result.value.revokedAt).toBeInstanceOf(Date);
    }

    expect(deps.invitationRepo.update).toHaveBeenCalledWith(
      INVITATION_ID,
      expect.objectContaining({
        status: 'REVOKED',
        revokedAt: expect.any(Date),
      })
    );
  });

  it('returns error for non-existent invitation', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.findById as any).mockResolvedValue(null);

    const result = await revokeInvitation(
      {
        tenantId: TENANT_ID,
        invitationId: INVITATION_ID,
        revokedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.name).toBe('NotFoundError');
    }
  });

  it('returns error for already accepted invitation', async () => {
    const acceptedInvitation = makeInvitation({
      status: 'ACCEPTED',
      acceptedAt: new Date(),
    });
    const deps = makeDeps();
    (deps.invitationRepo.findById as any).mockResolvedValue(acceptedInvitation);

    const result = await revokeInvitation(
      {
        tenantId: TENANT_ID,
        invitationId: INVITATION_ID,
        revokedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('only revoke pending');
    }
  });

  it('writes proof chain entry for revocation', async () => {
    const invitation = makeInvitation();
    const deps = makeDeps();
    (deps.invitationRepo.findById as any).mockResolvedValue(invitation);

    await revokeInvitation(
      {
        tenantId: TENANT_ID,
        invitationId: INVITATION_ID,
        revokedBy: BUYER_USER_ID,
      },
      deps
    );

    expect(deps.proofChainWriter?.write).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'PORTAL_INVITATION_REVOKED',
        actorId: BUYER_USER_ID,
      }),
      undefined
    );
  });
});

// ─── Tests: listInvitations ─────────────────────────────────────────────────

describe('listInvitations', () => {
  it('returns paginated list of invitations', async () => {
    const invitations = [
      makeInvitation({ id: 'inv-1' }),
      makeInvitation({ id: 'inv-2', status: 'ACCEPTED' }),
      makeInvitation({ id: 'inv-3', status: 'REVOKED' }),
    ];
    const deps = makeDeps();
    (deps.invitationRepo.list as any).mockResolvedValue({
      items: invitations,
      total: 3,
    });

    const result = await listInvitations(
      {
        tenantId: TENANT_ID,
        page: 1,
        limit: 20,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.items).toHaveLength(3);
      expect(result.value.total).toBe(3);
      expect(result.value.page).toBe(1);
      expect(result.value.limit).toBe(20);
      expect(result.value.hasMore).toBe(false);
    }
  });

  it('filters by status', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.list as any).mockResolvedValue({
      items: [makeInvitation({ status: 'PENDING' })],
      total: 1,
    });

    const result = await listInvitations(
      {
        tenantId: TENANT_ID,
        status: 'PENDING',
      },
      deps
    );

    expect(result.ok).toBe(true);
    expect(deps.invitationRepo.list).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ status: 'PENDING' })
    );
  });

  it('filters by email', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.list as any).mockResolvedValue({
      items: [makeInvitation({ email: 'search@example.com' })],
      total: 1,
    });

    const result = await listInvitations(
      {
        tenantId: TENANT_ID,
        email: 'search@example.com',
      },
      deps
    );

    expect(result.ok).toBe(true);
    expect(deps.invitationRepo.list).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ email: 'search@example.com' })
    );
  });

  it('calculates hasMore correctly for pagination', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.list as any).mockResolvedValue({
      items: Array(20).fill(makeInvitation()),
      total: 50,
    });

    const result = await listInvitations(
      {
        tenantId: TENANT_ID,
        page: 2,
        limit: 20,
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hasMore).toBe(true); // 50 total > 2 * 20 = 40
    }
  });

  it('uses default pagination values', async () => {
    const deps = makeDeps();
    (deps.invitationRepo.list as any).mockResolvedValue({
      items: [],
      total: 0,
    });

    const result = await listInvitations({ tenantId: TENANT_ID }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.page).toBe(1);
      expect(result.value.limit).toBe(20);
    }
  });
});
