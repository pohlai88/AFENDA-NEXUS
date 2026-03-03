/**
 * @afenda/supplier-kernel — Portal Kernel public API.
 *
 * This is the single import for all kernel components.
 * Dependencies: @afenda/core, @afenda/contracts, @afenda/authz (ports only).
 *
 * SP-1001 through SP-1010: Kernel infrastructure components.
 * SP-4001 through SP-4004: Pure domain logic.
 */

// ─── SP-1010: PortalRequestContext ──────────────────────────────────────────
export {
  PORTAL_ROLES,
  BUYER_PORTAL_ROLES,
  PORTAL_PERMISSIONS,
  ACTOR_TYPES,
  type PortalRole,
  type BuyerPortalRole,
  type PortalPermission,
  type ActorType,
  type PortalRequestContext,
  type CreatePortalContextInput,
  derivePermissions,
  createPortalContext,
} from './context/portal-request-context.js';

// ─── SP-1001: Portal Identity ───────────────────────────────────────────────
export {
  type PortalIdentityResult,
  type IPortalIdentityResolver,
} from './identity/portal-identity.js';

// ─── SP-1002: Permissions + SoD ─────────────────────────────────────────────
export {
  hasPortalPermission,
  requirePortalPermission,
  type PortalSoDRule,
  PORTAL_SOD_RULES,
  checkSoDConflict,
  requireNoSoDConflict,
  isRoleAtLeast,
  PortalPermissionError,
  PortalSoDViolationError,
} from './permissions/portal-permissions.js';

// ─── SP-1003: Status Dictionary ─────────────────────────────────────────────
export {
  type StatusDictionaryEntry,
  type StatusCategory,
  getStatusEntry,
  getStatusLabel,
  getStatusesByCategory,
  isValidStatusCode,
  getAllStatuses,
} from './status/portal-status-dictionary.js';

// ─── SP-1004: Notification Dispatcher ───────────────────────────────────────
export {
  PORTAL_NOTIFICATION_CHANNELS,
  type PortalNotificationChannel,
  type PortalNotificationType,
  type PortalNotification,
  type IPortalNotificationDispatcher,
} from './notifications/portal-notification-dispatcher.js';

// ─── SP-1005: Audit Log ─────────────────────────────────────────────────────
export {
  type PortalAuditEntry,
  type IPortalAuditWriter,
  buildAuditEntry,
} from './audit/portal-audit-hook.js';

// ─── SP-1006: Proof Chain ───────────────────────────────────────────────────
export {
  type ProofChainEntry,
  type ProofEventType,
  type ProofChainInput,
  type ChainVerificationResult,
  computeProofHash,
  computeProofHashAsync,
  verifyChainSegment,
  type IProofChainWriter,
  type IProofChainReader,
} from './proof/proof-chain-writer.js';

// ─── SP-1007: Attachment Policy ─────────────────────────────────────────────
export {
  ATTACHMENT_SIZE_LIMITS,
  ATTACHMENT_ALLOWED_TYPES,
  type AttachmentCategory,
  type AttachmentValidationInput,
  type AttachmentValidationResult,
  validateAttachment,
  computeFileChecksum,
} from './attachments/portal-attachment-policy.js';

// ─── SP-1008: Case ID Generator ────────────────────────────────────────────
export { formatCaseId, parseCaseId, type ICaseIdGenerator } from './case-id/portal-case-id.js';

// ─── SP-1009: Idempotency ──────────────────────────────────────────────────
export {
  type IdempotencyClaimInput,
  type IdempotencyResult,
  type IPortalIdempotencyStore,
  extractIdempotencyKey,
  isValidIdempotencyKey,
} from './idempotency/portal-idempotency.js';

// ─── Portal Registry ───────────────────────────────────────────────────────
export {
  PORTAL_REGISTRY,
  type SpCode,
  type SpStatus,
  type SpRegistryEntry,
  getRegistryEntry,
  getEntriesByPhase,
  getEntriesByCap,
  getPhaseCompletion,
} from './portal-registry.js';

// ─── SP-4001: Case State Machine ───────────────────────────────────────────
export {
  CASE_STATUSES,
  CASE_CATEGORIES,
  CASE_PRIORITIES,
  type CaseStatus,
  type CaseCategory,
  type CasePriority,
  isValidCaseTransition,
  getValidNextStatuses,
  assertCaseTransition,
  isTerminalStatus,
  isActiveStatus,
  InvalidCaseTransitionError,
} from './domain/case-state-machine.js';

// ─── SP-4002: Payment Stage Machine ────────────────────────────────────────
export {
  PAYMENT_STAGES,
  PAYMENT_SOURCES,
  type PaymentStage,
  type PaymentSource,
  hasHigherPrecedence,
  isValidPaymentTransition,
  getValidNextStages,
  assertPaymentTransition,
  isTerminalStage,
  InvalidPaymentTransitionError,
} from './domain/payment-stage-machine.js';

// ─── SP-4003: SLA Calculator ────────────────────────────────────────────────
export {
  type SlaConfig,
  getSlaConfig,
  computeSlaDeadline,
  isSlaBreached,
  slaRemainingMs,
  slaProgressPercent,
} from './domain/sla-calculator.js';

// ─── SP-4004: Bulk Upload Fingerprint ───────────────────────────────────────
export {
  DEDUPE_POLICIES,
  type DedupePolicy,
  type BulkUploadRow,
  type DedupeCheckResult,
  computeRowFingerprintInput,
  computeRowFingerprint,
} from './domain/bulk-upload-fingerprint.js';
