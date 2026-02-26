/**
 * W4-4: Invoice attachment entity.
 *
 * Links the document slice to AP invoices. Each attachment references
 * a document stored in the document/object store via a storage key.
 */
export interface InvoiceAttachment {
  readonly id: string;
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly storageKey: string;
  readonly fileSizeBytes: number;
  readonly uploadedBy: string;
  readonly createdAt: Date;
}

export interface IInvoiceAttachmentRepo {
  attach(input: CreateAttachmentInput): Promise<InvoiceAttachment>;
  findByInvoice(invoiceId: string): Promise<InvoiceAttachment[]>;
  remove(id: string): Promise<void>;
}

export interface CreateAttachmentInput {
  readonly tenantId: string;
  readonly invoiceId: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly storageKey: string;
  readonly fileSizeBytes: number;
  readonly uploadedBy: string;
}
