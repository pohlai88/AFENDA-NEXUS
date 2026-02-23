import type { Result, PaginationParams, PaginatedResult } from "@afenda/core";
import type { ClassificationRule, ClassificationRuleSet, ReportingStandard } from "../../hub/entities/classification-rule.js";

export interface IClassificationRuleRepo {
  findByStandard(
    standard: ReportingStandard,
    version?: number,
  ): Promise<Result<ClassificationRuleSet>>;
  findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<ClassificationRuleSet>>>;
  findRuleById(id: string): Promise<Result<ClassificationRule>>;
}
