import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { RevenueContract, RecognitionMilestone } from "../../hub/entities/revenue-recognition.js";

export interface IRevenueContractRepo {
  create(input: CreateRevenueContractInput): Promise<Result<RevenueContract>>;
  findById(id: string): Promise<Result<RevenueContract>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<RevenueContract>>>;
  updateRecognized(id: string, recognizedAmount: bigint): Promise<Result<RevenueContract>>;
  findMilestones(contractId: string): Promise<Result<RecognitionMilestone[]>>;
}

export interface CreateRevenueContractInput {
  readonly tenantId: string;
  readonly companyId: string;
  readonly contractNumber: string;
  readonly customerName: string;
  readonly totalAmount: bigint;
  readonly currency: string;
  readonly recognitionMethod: "STRAIGHT_LINE" | "MILESTONE" | "PERCENTAGE_OF_COMPLETION";
  readonly startDate: Date;
  readonly endDate: Date;
  readonly deferredAccountId: string;
  readonly revenueAccountId: string;
}
