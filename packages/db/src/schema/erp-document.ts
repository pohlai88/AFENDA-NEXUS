import { sql } from 'drizzle-orm';
import { index, integer, smallint, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { erpSchema } from './_schemas';
import { tenantCol, timestamps } from './_common';
import {
  documentCategoryEnum,
  documentStatusEnum,
  integrityStatusEnum,
  linkedEntityTypeEnum,
  scanStatusEnum,
} from './_enums';

// ─── erp.document_attachment ─────────────────────────────────────────────────

export const documentAttachments = erpSchema.table(
  'document_attachment',
  {
    documentId: uuid('document_id')
      .primaryKey()
      .default(sql`uuid_generate_v7()`),
    ...tenantCol(),
    keyVersion: smallint('key_version').notNull().default(1),
    bucket: text('bucket').notNull(),
    storageKey: text('storage_key').notNull(),
    provider: text('provider').notNull().default('R2'),
    fileName: text('file_name').notNull(),
    fileNameOriginal: text('file_name_original'),
    declaredSize: integer('declared_size'),
    declaredMime: text('declared_mime'),
    observedSize: integer('observed_size'),
    observedMime: text('observed_mime'),
    checksumSha256: text('checksum_sha256'),
    status: documentStatusEnum('status').notNull().default('PENDING_UPLOAD'),
    integrityStatus: integrityStatusEnum('integrity_status').notNull().default('PENDING'),
    scanStatus: scanStatusEnum('scan_status').notNull().default('NOT_SCANNED'),
    category: documentCategoryEnum('category'),
    description: text('description'),
    ...timestamps(),
    createdBy: uuid('created_by'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by'),
    storageDeletedAt: timestamp('storage_deleted_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_document_attachment_tenant_checksum')
      .on(t.tenantId, t.checksumSha256)
      .where(sql`${t.deletedAt} IS NULL AND ${t.checksumSha256} IS NOT NULL`),
    index('idx_document_attachment_tenant_status').on(t.tenantId, t.status),
    index('idx_document_attachment_tenant_checksum_lookup').on(t.tenantId, t.checksumSha256),
  ]
);

// ─── erp.document_link ───────────────────────────────────────────────────────

export const documentLinks = erpSchema.table(
  'document_link',
  {
    documentId: uuid('document_id')
      .notNull()
      .references(() => documentAttachments.documentId, { onDelete: 'cascade' }),
    ...tenantCol(),
    entityType: linkedEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    linkedBy: uuid('linked_by').notNull(),
    linkedAt: timestamp('linked_at', { withTimezone: true }).notNull().defaultNow(),
    linkedCompanyId: uuid('linked_company_id'),
  },
  (t) => [
    uniqueIndex('uq_document_link_tenant_entity_doc').on(
      t.tenantId,
      t.entityType,
      t.entityId,
      t.documentId
    ),
    index('idx_document_link_tenant_entity').on(t.tenantId, t.entityType, t.entityId),
    index('idx_document_link_tenant_document').on(t.tenantId, t.documentId),
  ]
);
