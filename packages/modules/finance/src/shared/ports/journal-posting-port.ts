/**
 * Cross-slice ports for journal posting.
 * Subledger slices (AP, AR, IC, Hub) that create GL journals
 * import these interfaces instead of directly from the GL slice.
 */
export type {
  IJournalRepo,
  CreateJournalInput,
} from "../../slices/gl/ports/journal-repo.js";
export type { IDocumentNumberGenerator } from "../../slices/gl/ports/document-number-generator.js";
export type {
  IJournalAuditRepo,
  AuditLogInput,
} from "../../slices/gl/ports/journal-audit-repo.js";
