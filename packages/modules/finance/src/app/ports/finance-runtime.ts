/**
 * FinanceDeps — composed from per-slice deps interfaces.
 *
 * Each slice defines its own narrow deps (GlDeps, FxDeps, etc.).
 * Services receive only their slice's deps + SharedDeps.
 * FinanceDeps is the union used by the runtime composition root.
 */
import type { GlDeps } from '../../slices/gl/ports/gl-deps.js';
import type { FxDeps } from '../../slices/fx/ports/fx-deps.js';
import type { IcDeps } from '../../slices/ic/ports/ic-deps.js';
import type { HubDeps } from '../../slices/hub/ports/hub-deps.js';
import type { ApDeps } from '../../slices/ap/ports/ap-deps.js';
import type { ArDeps } from '../../slices/ar/ports/ar-deps.js';
import type { TaxDeps } from '../../slices/tax/ports/tax-deps.js';
import type { FaDeps } from '../../slices/fixed-assets/ports/fa-deps.js';
import type { BankDeps } from '../../slices/bank/ports/bank-deps.js';
import type { CreditDeps } from '../../slices/credit/ports/credit-deps.js';
import type { ExpenseDeps } from '../../slices/expense/ports/expense-deps.js';
import type { ProjectDeps } from '../../slices/project/ports/project-deps.js';
import type { LeaseDeps } from '../../slices/lease/ports/lease-deps.js';
import type { ProvisionDeps } from '../../slices/provision/ports/provision-deps.js';
import type { TreasuryDeps } from '../../slices/treasury/ports/treasury-deps.js';
import type { CostAccountingDeps } from '../../slices/cost-accounting/ports/cost-accounting-deps.js';
import type { ConsolidationDeps } from '../../slices/consolidation/ports/consolidation-deps.js';
import type { FinInstrumentsDeps } from '../../slices/fin-instruments/ports/fin-instruments-deps.js';
import type { HedgeDeps } from '../../slices/hedge/ports/hedge-deps.js';
import type { IntangiblesDeps } from '../../slices/intangibles/ports/intangibles-deps.js';
import type { DeferredTaxDeps } from '../../slices/deferred-tax/ports/deferred-tax-deps.js';
import type { TransferPricingDeps } from '../../slices/transfer-pricing/ports/transfer-pricing-deps.js';
import type { SharedDeps } from '../../shared/ports/shared-deps.js';

export interface FinanceDeps
  extends
    GlDeps,
    FxDeps,
    IcDeps,
    HubDeps,
    ApDeps,
    ArDeps,
    TaxDeps,
    FaDeps,
    BankDeps,
    CreditDeps,
    ExpenseDeps,
    ProjectDeps,
    LeaseDeps,
    ProvisionDeps,
    TreasuryDeps,
    CostAccountingDeps,
    ConsolidationDeps,
    FinInstrumentsDeps,
    HedgeDeps,
    IntangiblesDeps,
    DeferredTaxDeps,
    TransferPricingDeps,
    SharedDeps {}

export type {
  GlDeps,
  FxDeps,
  IcDeps,
  HubDeps,
  ApDeps,
  ArDeps,
  TaxDeps,
  FaDeps,
  BankDeps,
  CreditDeps,
  ExpenseDeps,
  ProjectDeps,
  LeaseDeps,
  ProvisionDeps,
  TreasuryDeps,
  CostAccountingDeps,
  ConsolidationDeps,
  FinInstrumentsDeps,
  HedgeDeps,
  IntangiblesDeps,
  DeferredTaxDeps,
  TransferPricingDeps,
  SharedDeps,
};

export interface FinanceRuntime {
  withTenant<T>(
    ctx: { tenantId: string; userId: string },
    fn: (deps: FinanceDeps) => Promise<T>
  ): Promise<T>;
  /** When DATABASE_URL_READONLY is set, use for read-only report queries (reduces primary load). */
  withTenantReadOnly?<T>(
    ctx: { tenantId: string; userId: string },
    fn: (deps: FinanceDeps) => Promise<T>
  ): Promise<T>;
}
