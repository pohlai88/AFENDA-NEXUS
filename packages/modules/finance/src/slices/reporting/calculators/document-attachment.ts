/**
 * Re-exports document-attachment types and calculator from shared.
 * E16: document slice imports from shared/ports, not from reporting.
 */
export {
  type DocumentCategory,
  type LinkedEntityType,
  type DocumentAttachment,
  type DocumentLink,
  type DocumentTraceInput,
  type DocumentTraceResult,
  type IDocumentStore,
  evaluateDocumentCompleteness,
} from '../../../shared/ports/document-attachment.js';
