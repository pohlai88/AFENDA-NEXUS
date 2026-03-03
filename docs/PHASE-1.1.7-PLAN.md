# Phase 1.1.7 Implementation Plan — Invitation Flow (CAP-INV)

**Status:** Ready for Development  
**Author:** AI Agent  
**Date:** March 2, 2026  
**Dependencies:** Phases 1.1.1-1.1.6 Complete (305 tests passing)

---

## Executive Summary

This document provides a comprehensive blueprint for implementing **Phase 1.1.7:
Supplier Invitation Flow (CAP-INV)**.

**Goal:** Enable buyer-side admins to invite new suppliers to the portal via
magic link email, triggering the onboarding wizard flow (Phase 1.1.2).

**Zero Debugging Hell Strategy:**

1. ✅ Reuse existing onboarding infrastructure (Phase 1.1.2)
2. ✅ Magic link token generation with secure expiry
3. ✅ Email template system (transactional emails)
4. ✅ Deep-linking to onboarding wizard
5. ✅ Invitation state tracking

---

## 1. Requirements

### User Story

> **As a buyer admin**, I want to send portal invitations to prospective
> suppliers via email, so they can self-register and complete onboarding without
> manual account creation.

### Success Criteria

- ✅ Buyer admin can invite supplier by email address
- ✅ System generates unique magic link token (secure, time-limited)
- ✅ Email sent to supplier with registration link
- ✅ Magic link validates and creates supplier account
- ✅ Supplier redirected to onboarding wizard (Phase 1.1.2)
- ✅ Invitation tracking (sent, accepted, expired, revoked)
- ✅ Re-send capability for expired/failed invitations
- ✅ Audit trail for compliance

### Integration Points

**Existing Infrastructure:**

1. **Supplier Onboarding** (Phase 1.1.2)
   - Service: `supplier-portal-onboarding.ts`
   - Status enum: `PROSPECT → PENDING_APPROVAL → ACTIVE`
   - Wizard steps: company_info → bank_details → kyc_documents →
     tax_registration → review

2. **Notifications** (SP-1004)
   - Service: Email sending infrastructure
   - Templates: Transactional email system

3. **Proof Chain** (SP-1006)
   - Writer: `IProofChainWriter` for audit trail
   - Events: `INVITATION_SENT`, `INVITATION_ACCEPTED`, `INVITATION_REVOKED`

**New Components:**

1. Invitation service (token generation, validation)
2. Magic link handling route
3. Email templates (invitation, reminder, expiry)
4. Buyer-side invitation management UI (ERP)
5. Supplier-side registration page

---

## 2. Database Schema

### 2.1 Invitation Table

**File:** `packages/db/src/schema/portal-invitation.ts`

```typescript
import {
  pgSchema,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { tenantCol, timestamps, pkId } from './_common.js';

export const portalSchema = pgSchema('portal'); // Reuse from 1.1.5-1.1.6

export const invitationStatusEnum = pgEnum('invitation_status', [
  'PENDING', // Sent, awaiting acceptance
  'ACCEPTED', // Supplier clicked link and started onboarding
  'EXPIRED', // Token expired (default: 7 days)
  'REVOKED', // Buyer cancelled invitation
]);

export const portalInvitations = portalSchema.table('supplier_invitation', {
  ...pkId,
  ...tenantCol,

  // Invitee Details
  email: varchar('email', { length: 255 }).notNull(),
  supplierName: varchar('supplier_name', { length: 255 }).notNull(), // Suggested name

  // Token
  token: varchar('token', { length: 64 }).notNull().unique(), // Secure random token
  tokenExpiresAt: timestamp('token_expires_at', {
    withTimezone: true,
  }).notNull(),

  // Status Tracking
  status: invitationStatusEnum('status').notNull().default('PENDING'),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  // Created Supplier Link (after acceptance)
  supplierId: uuid('supplier_id'), // FK to supplier table (nullable until accepted)

  // Audit
  invitedBy: uuid('invited_by').notNull(), // User ID who sent invitation
  invitationMessage: text('invitation_message'), // Optional custom message from buyer

  ...timestamps,
});

// Index for fast token lookup
export const invitationTokenIndex = unique('invitation_token_idx').on(
  portalInvitations.token
);

// Index for email lookup (prevent duplicate invites)
export const invitationEmailIndex = index('invitation_email_idx').on(
  portalInvitations.email,
  portalInvitations.tenantId
);
```

**Migration:** Add to schema exports in `packages/db/src/schema/index.ts`

---

## 3. Contracts (SP-2008: Invitation Flow)

**File:** `packages/contracts/src/portal/index.ts`

```typescript
// ─── SP-2008: Invitation Flow (Phase 1.1.7 CAP-INV) ────────────────────────

export const InvitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED',
]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const SendInvitationSchema = z.object({
  email: z.string().email(),
  supplierName: z.string().min(2).max(255),
  invitationMessage: z.string().max(1000).optional(),
});
export type SendInvitation = z.infer<typeof SendInvitationSchema>;

export const InvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  supplierName: z.string(),
  status: InvitationStatusSchema,
  sentAt: z.string().datetime(), // ISO 8601
  acceptedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
  invitedBy: z.string().uuid(),
  invitationMessage: z.string().nullable(),
});
export type Invitation = z.infer<typeof InvitationSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().length(64),
});
export type AcceptInvitation = z.infer<typeof AcceptInvitationSchema>;

export const InvitationListSchema = z.object({
  items: z.array(InvitationSchema),
  total: z.number().int(),
});
export type InvitationList = z.infer<typeof InvitationListSchema>;
```

---

## 4. Service Layer

### 4.1 Domain Types

**File:**
`packages/modules/finance/src/slices/ap/services/supplier-portal-invitation.ts`

```typescript
/**
 * Phase 1.1.7: Supplier Invitation Flow (CAP-INV).
 *
 * Enables buyer admins to invite suppliers via magic link email.
 * Integrates with Phase 1.1.2 onboarding wizard.
 *
 * Flow:
 * 1. Buyer sends invitation → creates token + sends email
 * 2. Supplier clicks magic link → validates token
 * 3. System creates supplier account (PROSPECT status)
 * 4. Supplier redirected to onboarding wizard
 */
import type { Result } from '@afenda/core';
import { ok, err, AppError } from '@afenda/core';
import crypto from 'node:crypto';
import type { ISupplierRepo } from '../ports/supplier-repo.js';
import type { IOutboxWriter } from '../../../shared/ports/outbox-writer.js';
import type { IProofChainWriter } from '@afenda/supplier-kernel';

// ─── Domain Types ───────────────────────────────────────────────────────────

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation {
  readonly id: string;
  readonly tenantId: string;
  readonly email: string;
  readonly supplierName: string;
  readonly token: string;
  readonly tokenExpiresAt: Date;
  readonly status: InvitationStatus;
  readonly sentAt: Date;
  readonly acceptedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly supplierId: string | null;
  readonly invitedBy: string;
  readonly invitationMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ─── Port Interface ─────────────────────────────────────────────────────────

export interface IInvitationRepo {
  create(
    invitation: Omit<Invitation, 'createdAt' | 'updatedAt'>
  ): Promise<Invitation>;
  findByToken(token: string): Promise<Invitation | null>;
  findByEmail(tenantId: string, email: string): Promise<Invitation | null>;
  updateStatus(
    id: string,
    status: InvitationStatus,
    data?: { acceptedAt?: Date; revokedAt?: Date; supplierId?: string }
  ): Promise<Invitation>;
  listByTenant(tenantId: string): Promise<readonly Invitation[]>;
}

// ─── Service Dependencies ───────────────────────────────────────────────────

export interface InvitationServiceDeps {
  readonly invitationRepo: IInvitationRepo;
  readonly supplierRepo: ISupplierRepo;
  readonly outboxWriter: IOutboxWriter;
  readonly proofChainWriter?: IProofChainWriter;
}

// ─── Request/Response Types ─────────────────────────────────────────────────

export interface SendInvitationRequest {
  readonly tenantId: string;
  readonly invitedBy: string; // User ID
  readonly email: string;
  readonly supplierName: string;
  readonly invitationMessage?: string;
}

export interface AcceptInvitationRequest {
  readonly token: string;
}

export interface RevokeInvitationRequest {
  readonly tenantId: string;
  readonly invitationId: string;
  readonly revokedBy: string;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
}

function calculateExpiryDate(): Date {
  const now = new Date();
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
}

// ─── Service Functions ──────────────────────────────────────────────────────

/**
 * Send invitation to a prospective supplier.
 * Creates invitation record, generates magic link, sends email.
 */
export async function sendInvitation(
  req: SendInvitationRequest,
  deps: InvitationServiceDeps
): Promise<Result<Invitation>> {
  // Check for existing active invitation
  const existing = await deps.invitationRepo.findByEmail(
    req.tenantId,
    req.email
  );
  if (existing && existing.status === 'PENDING') {
    return err(
      new AppError(
        'INVITATION_ALREADY_SENT',
        'An active invitation already exists for this email'
      )
    );
  }

  // Check if supplier already exists
  const supplierResult = await deps.supplierRepo.findByEmail(
    req.tenantId,
    req.email
  );
  if (supplierResult.ok && supplierResult.value) {
    return err(
      new AppError(
        'SUPPLIER_ALREADY_EXISTS',
        'A supplier with this email already exists'
      )
    );
  }

  // Create invitation
  const now = new Date();
  const invitation = await deps.invitationRepo.create({
    id: crypto.randomUUID(),
    tenantId: req.tenantId,
    email: req.email,
    supplierName: req.supplierName,
    token: generateSecureToken(),
    tokenExpiresAt: calculateExpiryDate(),
    status: 'PENDING',
    sentAt: now,
    acceptedAt: null,
    revokedAt: null,
    supplierId: null,
    invitedBy: req.invitedBy,
    invitationMessage: req.invitationMessage ?? null,
  });

  // Send email via outbox
  await deps.outboxWriter.write({
    tenantId: req.tenantId,
    eventType: 'SUPPLIER_INVITATION_SENT',
    aggregateId: invitation.id,
    aggregateType: 'invitation',
    payload: {
      invitationId: invitation.id,
      email: invitation.email,
      supplierName: invitation.supplierName,
      token: invitation.token,
      expiresAt: invitation.tokenExpiresAt.toISOString(),
      invitationMessage: invitation.invitationMessage,
    },
  });

  // Proof chain entry
  if (deps.proofChainWriter) {
    await deps.proofChainWriter.write(
      {
        eventId: crypto.randomUUID(),
        eventType: 'INVITATION_SENT',
        entityType: 'invitation',
        entityId: invitation.id,
        actorType: 'BUYER',
        actorId: req.invitedBy,
        eventAt: now,
        payload: {
          email: invitation.email,
          supplierName: invitation.supplierName,
          expiresAt: invitation.tokenExpiresAt.toISOString(),
        },
        previousHash: null,
      },
      undefined
    );
  }

  return ok(invitation);
}

/**
 * Accept invitation via magic link token.
 * Validates token, creates supplier account, redirects to onboarding.
 */
export async function acceptInvitation(
  req: AcceptInvitationRequest,
  deps: InvitationServiceDeps
): Promise<Result<{ supplierId: string; onboardingUrl: string }>> {
  // Find invitation by token
  const invitation = await deps.invitationRepo.findByToken(req.token);
  if (!invitation) {
    return err(
      new AppError('INVALID_TOKEN', 'Invalid or expired invitation token')
    );
  }

  // Validate status
  if (invitation.status !== 'PENDING') {
    return err(
      new AppError(
        'INVITATION_NOT_PENDING',
        `Invitation is ${invitation.status.toLowerCase()}`
      )
    );
  }

  // Validate expiry
  if (new Date() > invitation.tokenExpiresAt) {
    await deps.invitationRepo.updateStatus(invitation.id, 'EXPIRED');
    return err(new AppError('INVITATION_EXPIRED', 'Invitation has expired'));
  }

  // Check if supplier already created (race condition guard)
  if (invitation.supplierId) {
    return ok({
      supplierId: invitation.supplierId,
      onboardingUrl: `/portal/onboarding`,
    });
  }

  // Create supplier account
  const now = new Date();
  const supplierResult = await deps.supplierRepo.create({
    id: crypto.randomUUID(),
    tenantId: invitation.tenantId,
    name: invitation.supplierName,
    email: invitation.email,
    onboardingStatus: 'PROSPECT', // Triggers onboarding flow
    createdAt: now,
    updatedAt: now,
  });

  if (!supplierResult.ok) {
    return err(supplierResult.error);
  }

  const supplier = supplierResult.value;

  // Update invitation status
  await deps.invitationRepo.updateStatus(invitation.id, 'ACCEPTED', {
    acceptedAt: now,
    supplierId: supplier.id,
  });

  // Emit event
  await deps.outboxWriter.write({
    tenantId: invitation.tenantId,
    eventType: 'SUPPLIER_INVITATION_ACCEPTED',
    aggregateId: invitation.id,
    aggregateType: 'invitation',
    payload: {
      invitationId: invitation.id,
      supplierId: supplier.id,
      email: supplier.email,
    },
  });

  // Proof chain entry
  if (deps.proofChainWriter) {
    await deps.proofChainWriter.write(
      {
        eventId: crypto.randomUUID(),
        eventType: 'INVITATION_ACCEPTED',
        entityType: 'invitation',
        entityId: invitation.id,
        actorType: 'SUPPLIER',
        actorId: supplier.id,
        eventAt: now,
        payload: {
          supplierId: supplier.id,
          email: supplier.email,
        },
        previousHash: null,
      },
      undefined
    );
  }

  return ok({
    supplierId: supplier.id,
    onboardingUrl: `/portal/onboarding`,
  });
}

/**
 * Revoke a pending invitation.
 */
export async function revokeInvitation(
  req: RevokeInvitationRequest,
  deps: InvitationServiceDeps
): Promise<Result<Invitation>> {
  const invitation = await deps.invitationRepo.findByToken(req.invitationId);
  if (!invitation) {
    return err(new AppError('INVITATION_NOT_FOUND', 'Invitation not found'));
  }

  if (invitation.tenantId !== req.tenantId) {
    return err(new AppError('INVITATION_NOT_FOUND', 'Invitation not found'));
  }

  if (invitation.status !== 'PENDING') {
    return err(
      new AppError(
        'INVITATION_NOT_PENDING',
        `Cannot revoke ${invitation.status.toLowerCase()} invitation`
      )
    );
  }

  const now = new Date();
  const updated = await deps.invitationRepo.updateStatus(
    invitation.id,
    'REVOKED',
    {
      revokedAt: now,
    }
  );

  // Emit event
  await deps.outboxWriter.write({
    tenantId: req.tenantId,
    eventType: 'SUPPLIER_INVITATION_REVOKED',
    aggregateId: invitation.id,
    aggregateType: 'invitation',
    payload: {
      invitationId: invitation.id,
      revokedBy: req.revokedBy,
    },
  });

  return ok(updated);
}

/**
 * List all invitations for a tenant (buyer-side management).
 */
export async function listInvitations(
  tenantId: string,
  deps: InvitationServiceDeps
): Promise<Result<readonly Invitation[]>> {
  const invitations = await deps.invitationRepo.listByTenant(tenantId);
  return ok(invitations);
}
```

---

## 5. Repository Implementation

**File:**
`packages/modules/finance/src/slices/ap/repos/drizzle-invitation-repo.ts`

```typescript
import type { TenantTx } from '@afenda/db/client';
import { portalInvitations } from '@afenda/db';
import { eq, and } from 'drizzle-orm';
import type {
  IInvitationRepo,
  Invitation,
  InvitationStatus,
} from '../services/supplier-portal-invitation.js';

export class DrizzleInvitationRepo implements IInvitationRepo {
  constructor(private readonly tx: TenantTx) {}

  async create(
    data: Omit<Invitation, 'createdAt' | 'updatedAt'>
  ): Promise<Invitation> {
    const now = new Date();
    const [row] = await this.tx
      .insert(portalInvitations)
      .values({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return this.mapToDomain(row);
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const row = await this.tx.query.portalInvitations.findFirst({
      where: (inv, { eq }) => eq(inv.token, token),
    });

    return row ? this.mapToDomain(row) : null;
  }

  async findByEmail(
    tenantId: string,
    email: string
  ): Promise<Invitation | null> {
    const row = await this.tx.query.portalInvitations.findFirst({
      where: (inv, { eq, and }) =>
        and(eq(inv.tenantId, tenantId), eq(inv.email, email)),
    });

    return row ? this.mapToDomain(row) : null;
  }

  async updateStatus(
    id: string,
    status: InvitationStatus,
    data?: { acceptedAt?: Date; revokedAt?: Date; supplierId?: string }
  ): Promise<Invitation> {
    const now = new Date();
    const [row] = await this.tx
      .update(portalInvitations)
      .set({
        status,
        acceptedAt: data?.acceptedAt,
        revokedAt: data?.revokedAt,
        supplierId: data?.supplierId,
        updatedAt: now,
      })
      .where(eq(portalInvitations.id, id))
      .returning();

    return this.mapToDomain(row);
  }

  async listByTenant(tenantId: string): Promise<readonly Invitation[]> {
    const rows = await this.tx
      .select()
      .from(portalInvitations)
      .where(eq(portalInvitations.tenantId, tenantId))
      .orderBy(portalInvitations.sentAt);

    return rows.map((row) => this.mapToDomain(row));
  }

  private mapToDomain(row: any): Invitation {
    return {
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      supplierName: row.supplierName,
      token: row.token,
      tokenExpiresAt: row.tokenExpiresAt,
      status: row.status,
      sentAt: row.sentAt,
      acceptedAt: row.acceptedAt,
      revokedAt: row.revokedAt,
      supplierId: row.supplierId,
      invitedBy: row.invitedBy,
      invitationMessage: row.invitationMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
```

---

## 6. DI Wiring

**File:** `packages/modules/finance/src/slices/ap/ports/ap-deps.ts`

```typescript
import type { IInvitationRepo } from '../services/supplier-portal-invitation.js';

export interface ApDeps {
  // ... existing repos ...
  readonly invitationRepo?: IInvitationRepo;
  // ...
}
```

**File:** `packages/modules/finance/src/runtime.ts`

```typescript
import { DrizzleInvitationRepo } from './slices/ap/repos/drizzle-invitation-repo.js';

function buildDeps(tx: TenantTx): FinanceDeps {
  return {
    // ... existing repos ...
    invitationRepo: new DrizzleInvitationRepo(tx),
    // ...
  };
}
```

---

## 7. Routes

### 7.1 API Routes (Buyer-Side)

**File:**
`packages/modules/finance/src/slices/ap/routes/supplier-portal-routes.ts`

```typescript
import { SendInvitationSchema } from '@afenda/contracts/portal';
import {
  sendInvitation,
  revokeInvitation,
  listInvitations,
} from '../services/supplier-portal-invitation.js';

// ── CAP-INV: Invitation Flow (Buyer Admin) ─────────────────────────────

app.post(
  '/portal/invitations',
  { preHandler: [requirePermission(policy, 'invitation:create')] },
  async (req, reply) => {
    const { tenantId, userId } = extractIdentity(req);
    const body = SendInvitationSchema.parse(req.body);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return sendInvitation(
          {
            tenantId,
            invitedBy: userId,
            email: body.email,
            supplierName: body.supplierName,
            invitationMessage: body.invitationMessage,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.status(201).send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);

app.get(
  '/portal/invitations',
  { preHandler: [requirePermission(policy, 'invitation:read')] },
  async (req, reply) => {
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return listInvitations(tenantId, deps);
      }
    );

    return result.ok
      ? reply.send({ items: result.value, total: result.value.length })
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);

app.post(
  '/portal/invitations/:id/revoke',
  { preHandler: [requirePermission(policy, 'invitation:delete')] },
  async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const { tenantId, userId } = extractIdentity(req);

    const result = await runtime.withTenant(
      { tenantId, userId },
      async (deps) => {
        return revokeInvitation(
          {
            tenantId,
            invitationId: id,
            revokedBy: userId,
          },
          deps
        );
      }
    );

    return result.ok
      ? reply.send(result.value)
      : reply
          .status(mapErrorToStatus(result.error))
          .send({ error: result.error });
  }
);
```

### 7.2 Public Magic Link Route (Supplier-Side)

**File:**
`packages/modules/finance/src/slices/ap/routes/supplier-portal-public-routes.ts`
(NEW)

```typescript
import type { FastifyInstance } from 'fastify';
import { AcceptInvitationSchema } from '@afenda/contracts/portal';
import { acceptInvitation } from '../services/supplier-portal-invitation.js';
import { runtime } from '../../../runtime.js';

/**
 * Public routes (no authentication required).
 * Used for magic link handling.
 */
export function registerPublicRoutes(app: FastifyInstance) {
  // Magic link acceptance
  app.post('/portal/public/accept-invitation', async (req, reply) => {
    const body = AcceptInvitationSchema.parse(req.body);

    // No auth required — token is the authentication
    const result = await runtime.withoutTenant(async (deps) => {
      return acceptInvitation({ token: body.token }, deps);
    });

    if (result.ok) {
      // Set session cookie for new supplier
      // TODO: Integrate with Better Auth session creation
      return reply.send({
        success: true,
        supplierId: result.value.supplierId,
        redirectUrl: result.value.onboardingUrl,
      });
    }

    return reply
      .status(mapErrorToStatus(result.error))
      .send({ error: result.error });
  });
}
```

---

## 8. Email Templates

### 8.1 Invitation Email

**File:**
`packages/modules/finance/src/slices/ap/templates/supplier-invitation-email.ts`

```typescript
export interface InvitationEmailData {
  supplierName: string;
  buyerCompanyName: string;
  invitationMessage?: string;
  magicLinkUrl: string;
  expiresAt: string; // ISO 8601
}

export function renderInvitationEmail(data: InvitationEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Supplier Portal Invitation</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">You're Invited to Join ${data.buyerCompanyName}'s Supplier Portal</h1>
    
    <p>Dear ${data.supplierName},</p>
    
    ${data.invitationMessage ? `<p style="background: #f3f4f6; padding: 16px; border-left: 4px solid #2563eb;">${data.invitationMessage}</p>` : ''}
    
    <p>You've been invited to register on our supplier portal. This portal provides:</p>
    <ul>
      <li>Real-time payment tracking</li>
      <li>Invoice submission and status updates</li>
      <li>Direct messaging with our AP team</li>
      <li>Document management and compliance tracking</li>
    </ul>
    
    <p>To complete your registration and access the portal:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.magicLinkUrl}" 
         style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Complete Registration
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      This invitation expires on ${new Date(data.expiresAt).toLocaleString()}. 
      If you did not expect this invitation, please ignore this email.
    </p>
    
    <p style="color: #6b7280; font-size: 14px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${data.magicLinkUrl}">${data.magicLinkUrl}</a>
    </p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
    
    <p style="color: #9ca3af; font-size: 12px;">
      © ${new Date().getFullYear()} ${data.buyerCompanyName}. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

export function renderInvitationPlainText(data: InvitationEmailData): string {
  return `
You're Invited to Join ${data.buyerCompanyName}'s Supplier Portal

Dear ${data.supplierName},

${data.invitationMessage ? data.invitationMessage + '\\n\\n' : ''}

You've been invited to register on our supplier portal. This portal provides:
- Real-time payment tracking
- Invoice submission and status updates
- Direct messaging with our AP team
- Document management and compliance tracking

To complete your registration, visit:
${data.magicLinkUrl}

This invitation expires on ${new Date(data.expiresAt).toLocaleString()}.

If you did not expect this invitation, please ignore this email.

---
© ${new Date().getFullYear()} ${data.buyerCompanyName}. All rights reserved.
  `.trim();
}
```

---

## 9. Tests

**File:**
`packages/modules/finance/src/slices/ap/services/supplier-portal-invitation.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ok, err, AppError } from '@afenda/core';
import type {
  Invitation,
  IInvitationRepo,
  InvitationServiceDeps,
} from '../supplier-portal-invitation.js';
import {
  sendInvitation,
  acceptInvitation,
  revokeInvitation,
  listInvitations,
} from '../supplier-portal-invitation.js';

// ─── Mock Repository ────────────────────────────────────────────────────────

class MockInvitationRepo implements IInvitationRepo {
  private invitations: Map<string, Invitation> = new Map();

  async create(
    data: Omit<Invitation, 'createdAt' | 'updatedAt'>
  ): Promise<Invitation> {
    const now = new Date();
    const invitation: Invitation = { ...data, createdAt: now, updatedAt: now };
    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return (
      Array.from(this.invitations.values()).find(
        (inv) => inv.token === token
      ) ?? null
    );
  }

  async findByEmail(
    tenantId: string,
    email: string
  ): Promise<Invitation | null> {
    return (
      Array.from(this.invitations.values()).find(
        (inv) => inv.tenantId === tenantId && inv.email === email
      ) ?? null
    );
  }

  async updateStatus(
    id: string,
    status: string,
    data?: any
  ): Promise<Invitation> {
    const invitation = this.invitations.get(id)!;
    const updated = {
      ...invitation,
      status: status as any,
      ...data,
      updatedAt: new Date(),
    };
    this.invitations.set(id, updated);
    return updated;
  }

  async listByTenant(tenantId: string): Promise<readonly Invitation[]> {
    return Array.from(this.invitations.values()).filter(
      (inv) => inv.tenantId === tenantId
    );
  }

  reset() {
    this.invitations.clear();
  }
}

// Mock supplier repo
class MockSupplierRepo {
  private suppliers: any[] = [];

  async findByEmail(tenantId: string, email: string) {
    const supplier = this.suppliers.find(
      (s) => s.tenantId === tenantId && s.email === email
    );
    return supplier ? ok(supplier) : ok(null);
  }

  async create(data: any) {
    this.suppliers.push(data);
    return ok(data);
  }

  reset() {
    this.suppliers = [];
  }
}

// Mock outbox
class MockOutboxWriter {
  events: any[] = [];
  async write(event: any) {
    this.events.push(event);
  }
  reset() {
    this.events = [];
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('sendInvitation', () => {
  let mockInvitationRepo: MockInvitationRepo;
  let mockSupplierRepo: MockSupplierRepo;
  let mockOutboxWriter: MockOutboxWriter;
  let deps: InvitationServiceDeps;

  beforeEach(() => {
    mockInvitationRepo = new MockInvitationRepo();
    mockSupplierRepo = new MockSupplierRepo();
    mockOutboxWriter = new MockOutboxWriter();
    deps = {
      invitationRepo: mockInvitationRepo,
      supplierRepo: mockSupplierRepo as any,
      outboxWriter: mockOutboxWriter as any,
    };
  });

  it('should create invitation and send email', async () => {
    const result = await sendInvitation(
      {
        tenantId: 'tenant-001',
        invitedBy: 'user-001',
        email: 'supplier@example.com',
        supplierName: 'ACME Corp',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe('supplier@example.com');
      expect(result.value.supplierName).toBe('ACME Corp');
      expect(result.value.status).toBe('PENDING');
      expect(result.value.token).toHaveLength(64);
      expect(mockOutboxWriter.events).toHaveLength(1);
      expect(mockOutboxWriter.events[0].eventType).toBe(
        'SUPPLIER_INVITATION_SENT'
      );
    }
  });

  it('should prevent duplicate active invitations', async () => {
    await sendInvitation(
      {
        tenantId: 'tenant-001',
        invitedBy: 'user-001',
        email: 'supplier@example.com',
        supplierName: 'ACME Corp',
      },
      deps
    );

    const result = await sendInvitation(
      {
        tenantId: 'tenant-001',
        invitedBy: 'user-001',
        email: 'supplier@example.com',
        supplierName: 'ACME Corp',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVITATION_ALREADY_SENT');
    }
  });

  it('should prevent invitation if supplier already exists', async () => {
    await mockSupplierRepo.create({
      id: 'sup-001',
      tenantId: 'tenant-001',
      email: 'existing@example.com',
      name: 'Existing Supplier',
    });

    const result = await sendInvitation(
      {
        tenantId: 'tenant-001',
        invitedBy: 'user-001',
        email: 'existing@example.com',
        supplierName: 'Existing Supplier',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('SUPPLIER_ALREADY_EXISTS');
    }
  });
});

describe('acceptInvitation', () => {
  let mockInvitationRepo: MockInvitationRepo;
  let mockSupplierRepo: MockSupplierRepo;
  let mockOutboxWriter: MockOutboxWriter;
  let deps: InvitationServiceDeps;

  beforeEach(() => {
    mockInvitationRepo = new MockInvitationRepo();
    mockSupplierRepo = new MockSupplierRepo();
    mockOutboxWriter = new MockOutboxWriter();
    deps = {
      invitationRepo: mockInvitationRepo,
      supplierRepo: mockSupplierRepo as any,
      outboxWriter: mockOutboxWriter as any,
    };
  });

  it('should accept invitation and create supplier account', async () => {
    // Create invitation
    const invitation = await mockInvitationRepo.create({
      id: 'inv-001',
      tenantId: 'tenant-001',
      email: 'supplier@example.com',
      supplierName: 'ACME Corp',
      token: 'valid-token-123',
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      sentAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      supplierId: null,
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await acceptInvitation({ token: 'valid-token-123' }, deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.supplierId).toBeTruthy();
      expect(result.value.onboardingUrl).toBe('/portal/onboarding');
      expect(mockOutboxWriter.events).toHaveLength(1);
      expect(mockOutboxWriter.events[0].eventType).toBe(
        'SUPPLIER_INVITATION_ACCEPTED'
      );
    }
  });

  it('should reject invalid token', async () => {
    const result = await acceptInvitation({ token: 'invalid-token' }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TOKEN');
    }
  });

  it('should reject expired invitation', async () => {
    await mockInvitationRepo.create({
      id: 'inv-002',
      tenantId: 'tenant-001',
      email: 'supplier@example.com',
      supplierName: 'ACME Corp',
      token: 'expired-token',
      tokenExpiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      status: 'PENDING',
      sentAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      supplierId: null,
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await acceptInvitation({ token: 'expired-token' }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVITATION_EXPIRED');
    }
  });

  it('should reject already accepted invitation', async () => {
    await mockInvitationRepo.create({
      id: 'inv-003',
      tenantId: 'tenant-001',
      email: 'supplier@example.com',
      supplierName: 'ACME Corp',
      token: 'accepted-token',
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACCEPTED',
      sentAt: new Date(),
      acceptedAt: new Date(),
      revokedAt: null,
      supplierId: 'sup-001',
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await acceptInvitation({ token: 'accepted-token' }, deps);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVITATION_NOT_PENDING');
    }
  });
});

describe('revokeInvitation', () => {
  let mockInvitationRepo: MockInvitationRepo;
  let mockOutboxWriter: MockOutboxWriter;
  let deps: InvitationServiceDeps;

  beforeEach(() => {
    mockInvitationRepo = new MockInvitationRepo();
    mockOutboxWriter = new MockOutboxWriter();
    deps = {
      invitationRepo: mockInvitationRepo,
      supplierRepo: {} as any,
      outboxWriter: mockOutboxWriter as any,
    };
  });

  it('should revoke pending invitation', async () => {
    const invitation = await mockInvitationRepo.create({
      id: 'inv-001',
      tenantId: 'tenant-001',
      email: 'supplier@example.com',
      supplierName: 'ACME Corp',
      token: 'token-123',
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      sentAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      supplierId: null,
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await revokeInvitation(
      {
        tenantId: 'tenant-001',
        invitationId: 'inv-001',
        revokedBy: 'user-002',
      },
      deps
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('REVOKED');
      expect(mockOutboxWriter.events).toHaveLength(1);
      expect(mockOutboxWriter.events[0].eventType).toBe(
        'SUPPLIER_INVITATION_REVOKED'
      );
    }
  });

  it('should not revoke already accepted invitation', async () => {
    await mockInvitationRepo.create({
      id: 'inv-002',
      tenantId: 'tenant-001',
      email: 'supplier@example.com',
      supplierName: 'ACME Corp',
      token: 'token-123',
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACCEPTED',
      sentAt: new Date(),
      acceptedAt: new Date(),
      revokedAt: null,
      supplierId: 'sup-001',
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await revokeInvitation(
      {
        tenantId: 'tenant-001',
        invitationId: 'inv-002',
        revokedBy: 'user-002',
      },
      deps
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVITATION_NOT_PENDING');
    }
  });
});

describe('listInvitations', () => {
  let mockInvitationRepo: MockInvitationRepo;
  let deps: InvitationServiceDeps;

  beforeEach(() => {
    mockInvitationRepo = new MockInvitationRepo();
    deps = {
      invitationRepo: mockInvitationRepo,
      supplierRepo: {} as any,
      outboxWriter: {} as any,
    };
  });

  it('should list all invitations for tenant', async () => {
    await mockInvitationRepo.create({
      id: 'inv-001',
      tenantId: 'tenant-001',
      email: 'supplier1@example.com',
      supplierName: 'Supplier 1',
      token: 'token-1',
      tokenExpiresAt: new Date(),
      status: 'PENDING',
      sentAt: new Date(),
      acceptedAt: null,
      revokedAt: null,
      supplierId: null,
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    await mockInvitationRepo.create({
      id: 'inv-002',
      tenantId: 'tenant-001',
      email: 'supplier2@example.com',
      supplierName: 'Supplier 2',
      token: 'token-2',
      tokenExpiresAt: new Date(),
      status: 'ACCEPTED',
      sentAt: new Date(),
      acceptedAt: new Date(),
      revokedAt: null,
      supplierId: 'sup-001',
      invitedBy: 'user-001',
      invitationMessage: null,
    });

    const result = await listInvitations('tenant-001', deps);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });
});
```

**Expected:** 12+ tests pass

---

## 10. Frontend (Supplier-Side)

### 10.1 Magic Link Landing Page

**File:** `apps/web/src/app/(public)/accept-invitation/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link');
      return;
    }

    // Call API to accept invitation
    fetch('/api/portal/public/accept-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          // Redirect to onboarding after 2 seconds
          setTimeout(() => {
            router.push(data.redirectUrl);
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage(data.error?.message || 'Failed to accept invitation');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage('Network error. Please try again.');
      });
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Accepting Invitation...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Invitation Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              <p className="text-center text-muted-foreground">
                Processing your invitation...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="text-center text-muted-foreground">
                Your account has been created successfully!
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting to onboarding wizard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600" />
              <p className="text-center text-muted-foreground">{errorMessage}</p>
              <p className="text-center text-sm text-muted-foreground">
                Please contact support or request a new invitation.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 11. Development Workflow

### Step-by-Step Execution (~6 hours)

1. **Create DB Schema** (~20 min)
   - Add `portal_invitations` table + `invitationStatusEnum`
   - Export from `@afenda/db`
   - Run migration: `pnpm db:generate` then `pnpm db:push`

2. **Create Contracts** (~15 min)
   - Add SP-2008 section to `packages/contracts/src/portal/index.ts`
   - Define schemas: `InvitationSchema`, `SendInvitationSchema`,
     `AcceptInvitationSchema`

3. **Create Service** (~90 min)
   - File: `supplier-portal-invitation.ts`
   - Implement: `sendInvitation()`, `acceptInvitation()`, `revokeInvitation()`,
     `listInvitations()`
   - Add token generation + expiry helpers

4. **Create Repo** (~30 min)
   - File: `drizzle-invitation-repo.ts`
   - Implement `IInvitationRepo`

5. **Wire DI** (~10 min)
   - Add `invitationRepo` to `ApDeps` + `runtime.ts`

6. **Add Routes** (~40 min)
   - Buyer routes: POST/GET `/invitations`, POST `/invitations/:id/revoke`
   - Public route: POST `/public/accept-invitation`

7. **Create Email Templates** (~30 min)
   - File: `supplier-invitation-email.ts`
   - HTML + plain text templates

8. **Create Tests** (~90 min)
   - File: `supplier-portal-invitation.test.ts`
   - Test: send, accept, revoke, list, error cases
   - Target: 12+ tests, 100% coverage

9. **Create Frontend** (~60 min)
   - Magic link landing page: `/accept-invitation`
   - Buyer admin invitation UI (optional — ERP-side)

10. **Integration Testing** (~30 min)
    - Test full flow: send → email → click link → accept → redirect
    - Verify token expiry handling

**Total:** ~6.5 hours

---

## 12. Pre-Flight Checklist

### Before Starting

- [ ] Phase 1.1.5-1.1.6 complete (305 tests passing)
- [ ] Zero TypeScript errors
- [ ] Dev server runs: `pnpm dev`
- [ ] DB connection verified: `pnpm db:studio`

### After Completion

- [ ] Schema: `portal_supplier_invitation` table exists
- [ ] Contracts: SP-2008 exports in `@afenda/contracts/portal`
- [ ] Service: 4 functions implemented
- [ ] Repo: `IInvitationRepo` implemented
- [ ] DI: `invitationRepo` wired
- [ ] Routes: 4 endpoints (3 buyer + 1 public)
- [ ] Tests: 12+ tests passing
- [ ] Email templates: HTML + plain text
- [ ] Frontend: Magic link page working
- [ ] Full flow tested: send → accept → onboarding redirect
- [ ] TypeScript: Zero errors
- [ ] Test suite: 317+ tests passing (305 baseline + 12 new)

---

## 13. Success Criteria

### Functional

- ✅ Buyer can send invitation via email
- ✅ System generates secure 64-char magic link token
- ✅ Token expires after 7 days
- ✅ Supplier can accept invitation via magic link
- ✅ Supplier account created with PROSPECT status
- ✅ Supplier redirected to onboarding wizard
- ✅ Duplicate invitations prevented
- ✅ Existing suppliers cannot be re-invited
- ✅ Buyer can revoke pending invitations
- ✅ All actions logged to proof chain
- ✅ Email notification sent on invitation

### Non-Functional

- ✅ Token cryptographically secure (32 random bytes)
- ✅ Race condition handling (duplicate acceptance check)
- ✅ Tenant scope validation
- ✅ Audit trail compliance
- ✅ Email deliverability (transactional email service)

---

## 14. Future Enhancements (Post-Phase 1)

**Phase 2 Improvements:**

1. **Invitation Templates**
   - Buyer can create custom invitation message templates
   - Industry-specific onboarding flows

2. **Bulk Invitations**
   - CSV upload for mass invitation send
   - Batch status tracking

3. **Invitation Analytics**
   - Dashboard: sent, accepted, expired metrics
   - Average time-to-acceptance

4. **Reminder Emails**
   - Auto-send reminder 3 days before expiry
   - Manual reminder trigger

5. **SSO Integration**
   - Magic link creates SAML/OIDC identity
   - Seamless auth flow

---

## Appendix A: Error Codes

```typescript
// Invitation-specific errors
INVITATION_ALREADY_SENT: 'INVITATION_ALREADY_SENT',
SUPPLIER_ALREADY_EXISTS: 'SUPPLIER_ALREADY_EXISTS',
INVALID_TOKEN: 'INVALID_TOKEN',
INVITATION_EXPIRED: 'INVITATION_EXPIRED',
INVITATION_NOT_PENDING: 'INVITATION_NOT_PENDING',
INVITATION_NOT_FOUND: 'INVITATION_NOT_FOUND',
```

---

## Appendix B: Event Types

```typescript
// Add to packages/modules/finance/src/shared/events.ts
SUPPLIER_INVITATION_SENT: 'SUPPLIER_INVITATION_SENT',
SUPPLIER_INVITATION_ACCEPTED: 'SUPPLIER_INVITATION_ACCEPTED',
SUPPLIER_INVITATION_REVOKED: 'SUPPLIER_INVITATION_REVOKED',
SUPPLIER_INVITATION_EXPIRED: 'SUPPLIER_INVITATION_EXPIRED',
```

---

**Implementation Ready:** All patterns proven in Phases 1.1.1-1.1.6. Zero new
infrastructure required. Estimated delivery: 1 working day.

**Next Phase After 1.1.7:** Phase 1.2.1 — Messaging Hub (CAP-MSG)
