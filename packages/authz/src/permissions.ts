/**
 * @afenda/authz — ERP access control definitions.
 *
 * Pure RBAC role + permission definitions. No external auth dependencies.
 * Used by both web and API to enforce authorization.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'post'
  | 'void'
  | 'reverse'
  | 'close'
  | 'export'
  | 'approve'
  | 'invite'
  | 'remove';

export interface Permission {
  readonly resource: string;
  readonly action: Action;
}

export interface RoleDefinition {
  readonly name: string;
  readonly permissions: readonly Permission[];
}

// ─── ERP Resources & Actions ────────────────────────────────────────────────

export const erpStatements = {
  // ── Organization (built-in) ──────────────────────────────────────────
  organization: ['create', 'read', 'update', 'delete'],
  member: ['create', 'read', 'update', 'delete'],
  invitation: ['create', 'read', 'update', 'delete'],

  // ── Finance / General Ledger ─────────────────────────────────────────
  journal: ['create', 'read', 'update', 'delete', 'post', 'void', 'reverse'],
  account: ['create', 'read', 'update', 'delete'],
  fiscalPeriod: ['create', 'read', 'update', 'close'],
  trialBalance: ['read'],
  financialReport: ['read', 'export'],
  budget: ['create', 'read', 'update', 'delete', 'approve'],

  // ── Accounts Payable / Receivable ────────────────────────────────────
  apInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
  arInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
  payment: ['create', 'read', 'update', 'delete', 'post', 'void'],

  // ── Intercompany ─────────────────────────────────────────────────────
  icTransfer: ['create', 'read', 'update', 'delete', 'post'],

  // ── Settings & Administration ────────────────────────────────────────
  company: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  auditLog: ['read'],
  user: ['read', 'update', 'invite', 'remove'],

  // ── Document Storage ─────────────────────────────────────────────────
  document: ['create', 'read', 'delete'],
} as const;

// ─── Helper ─────────────────────────────────────────────────────────────────

function buildPermissions(statements: Record<string, readonly string[]>): Permission[] {
  return Object.entries(statements).flatMap(([resource, actions]) =>
    actions.map((action) => ({ resource, action: action as Action }))
  );
}

// ─── Roles ────────────────────────────────────────────────────────────────

/**
 * Owner: Full access to everything. Organization creator.
 */
export const owner: RoleDefinition = {
  name: 'owner',
  permissions: buildPermissions({
    organization: ['create', 'read', 'update', 'delete'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'update', 'delete'],
    journal: ['create', 'read', 'update', 'delete', 'post', 'void', 'reverse'],
    account: ['create', 'read', 'update', 'delete'],
    fiscalPeriod: ['create', 'read', 'update', 'close'],
    trialBalance: ['read'],
    financialReport: ['read', 'export'],
    budget: ['create', 'read', 'update', 'delete', 'approve'],
    apInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
    arInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
    payment: ['create', 'read', 'update', 'delete', 'post', 'void'],
    icTransfer: ['create', 'read', 'update', 'delete', 'post'],
    company: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    auditLog: ['read'],
    user: ['read', 'update', 'invite', 'remove'],
    document: ['create', 'read', 'delete'],
  }),
};

/**
 * Admin: Like owner but cannot delete organization or manage owners.
 */
export const admin: RoleDefinition = {
  name: 'admin',
  permissions: buildPermissions({
    organization: ['read', 'update'],
    member: ['create', 'read', 'update', 'delete'],
    invitation: ['create', 'read', 'update', 'delete'],
    journal: ['create', 'read', 'update', 'delete', 'post', 'void', 'reverse'],
    account: ['create', 'read', 'update', 'delete'],
    fiscalPeriod: ['create', 'read', 'update', 'close'],
    trialBalance: ['read'],
    financialReport: ['read', 'export'],
    budget: ['create', 'read', 'update', 'delete', 'approve'],
    apInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
    arInvoice: ['create', 'read', 'update', 'delete', 'post', 'void'],
    payment: ['create', 'read', 'update', 'delete', 'post', 'void'],
    icTransfer: ['create', 'read', 'update', 'delete', 'post'],
    company: ['create', 'read', 'update', 'delete'],
    settings: ['read', 'update'],
    auditLog: ['read'],
    user: ['read', 'update', 'invite', 'remove'],
    document: ['create', 'read', 'delete'],
  }),
};

/**
 * Accountant: Finance operations — can post/void/reverse journals, manage AP/AR.
 */
export const accountant: RoleDefinition = {
  name: 'accountant',
  permissions: buildPermissions({
    journal: ['create', 'read', 'update', 'post', 'void', 'reverse'],
    account: ['read'],
    fiscalPeriod: ['read'],
    trialBalance: ['read'],
    financialReport: ['read', 'export'],
    budget: ['read'],
    apInvoice: ['create', 'read', 'update', 'post', 'void'],
    arInvoice: ['create', 'read', 'update', 'post', 'void'],
    payment: ['create', 'read', 'update', 'post', 'void'],
    icTransfer: ['read'],
    company: ['read'],
    settings: ['read'],
    auditLog: ['read'],
    user: ['read'],
    document: ['create', 'read', 'delete'],
  }),
};

/**
 * Clerk: Data entry — can create & read journals/invoices but not post.
 */
export const clerk: RoleDefinition = {
  name: 'clerk',
  permissions: buildPermissions({
    journal: ['create', 'read', 'update'],
    account: ['read'],
    fiscalPeriod: ['read'],
    trialBalance: ['read'],
    financialReport: ['read'],
    budget: ['read'],
    apInvoice: ['create', 'read', 'update'],
    arInvoice: ['create', 'read', 'update'],
    payment: ['create', 'read', 'update'],
    icTransfer: ['read'],
    company: ['read'],
    settings: ['read'],
    auditLog: ['read'],
    user: ['read'],
    document: ['create', 'read'],
  }),
};

/**
 * Viewer: Read-only access to all ERP resources.
 */
export const viewer: RoleDefinition = {
  name: 'viewer',
  permissions: buildPermissions({
    journal: ['read'],
    account: ['read'],
    fiscalPeriod: ['read'],
    trialBalance: ['read'],
    financialReport: ['read'],
    budget: ['read'],
    apInvoice: ['read'],
    arInvoice: ['read'],
    payment: ['read'],
    icTransfer: ['read'],
    company: ['read'],
    settings: ['read'],
    auditLog: ['read'],
    user: ['read'],
    document: ['read'],
  }),
};

/**
 * Member: Default role — read-only ERP access.
 */
export const member: RoleDefinition = {
  name: 'member',
  permissions: buildPermissions({
    organization: ['read'],
    member: ['read'],
    invitation: ['read'],
    journal: ['read'],
    account: ['read'],
    fiscalPeriod: ['read'],
    trialBalance: ['read'],
    financialReport: ['read'],
    budget: ['read'],
    apInvoice: ['read'],
    arInvoice: ['read'],
    payment: ['read'],
    icTransfer: ['read'],
    company: ['read'],
    settings: ['read'],
    auditLog: ['read'],
    user: ['read'],
    document: ['read'],
  }),
};

// ─── Roles Map ────────────────────────────────────────────────────────────

export const roles = {
  owner,
  admin,
  accountant,
  clerk,
  viewer,
  member,
} as const;

export type RoleName = keyof typeof roles;
