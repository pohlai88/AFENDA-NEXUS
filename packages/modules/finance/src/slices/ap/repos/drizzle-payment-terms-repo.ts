import { eq } from 'drizzle-orm';
import { ok, err, NotFoundError } from '@afenda/core';
import type { Result } from '@afenda/core';
import type { TenantTx } from '@afenda/db';
import { paymentTermsTemplates } from '@afenda/db';
import type { PaymentTerms } from '../entities/payment-terms.js';
import type { IPaymentTermsRepo } from '../ports/payment-terms-repo.js';

type Row = typeof paymentTermsTemplates.$inferSelect;

function mapToDomain(row: Row): PaymentTerms {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    name: row.name,
    netDays: row.netDays,
    discountPercent: row.discountPercent,
    discountDays: row.discountDays,
    isActive: row.isActive,
  };
}

export class DrizzlePaymentTermsRepo implements IPaymentTermsRepo {
  constructor(private readonly tx: TenantTx) {}

  async findById(id: string): Promise<Result<PaymentTerms>> {
    const row = await this.tx.query.paymentTermsTemplates.findFirst({
      where: eq(paymentTermsTemplates.id, id),
    });
    if (!row) return err(new NotFoundError('PaymentTerms', id));
    return ok(mapToDomain(row));
  }

  async findByCode(code: string): Promise<Result<PaymentTerms>> {
    const row = await this.tx.query.paymentTermsTemplates.findFirst({
      where: eq(paymentTermsTemplates.code, code),
    });
    if (!row) return err(new NotFoundError('PaymentTerms', code));
    return ok(mapToDomain(row));
  }

  async findAll(): Promise<PaymentTerms[]> {
    const rows = await this.tx.query.paymentTermsTemplates.findMany({
      where: eq(paymentTermsTemplates.isActive, true),
    });
    return rows.map(mapToDomain);
  }
}
