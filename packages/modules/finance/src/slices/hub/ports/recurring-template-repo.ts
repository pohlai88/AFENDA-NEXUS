import type { PaginatedResult, PaginationParams } from "@afenda/core";
import type { RecurringTemplate } from "../../../domain/index.js";

export interface CreateRecurringTemplateInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly ledgerId: string;
  readonly description: string;
  readonly lines: readonly {
    readonly accountCode: string;
    readonly debit: bigint;
    readonly credit: bigint;
    readonly description?: string;
  }[];
  readonly frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  readonly nextRunDate: Date;
}

export interface IRecurringTemplateRepo {
  findById(id: string): Promise<RecurringTemplate | null>;
  findAll(params: PaginationParams): Promise<PaginatedResult<RecurringTemplate>>;
  findDue(asOfDate: Date): Promise<RecurringTemplate[]>;
  create(input: CreateRecurringTemplateInput): Promise<RecurringTemplate>;
  updateNextRunDate(id: string, nextRunDate: Date): Promise<void>;
  deactivate(id: string): Promise<void>;
}
