import type { Result } from '@afenda/core';
import type { PaymentTerms } from '../entities/payment-terms.js';

export interface IPaymentTermsRepo {
  findById(id: string): Promise<Result<PaymentTerms>>;
  findByCode(code: string): Promise<Result<PaymentTerms>>;
  findAll(): Promise<PaymentTerms[]>;
}
