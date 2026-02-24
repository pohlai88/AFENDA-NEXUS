import { eq, and, desc, count } from "drizzle-orm";
import type { TenantTx } from "@afenda/db";
import { classificationRuleSets, classificationRules } from "@afenda/db";
import { ok, err, NotFoundError, type Result, type PaginationParams, type PaginatedResult } from "@afenda/core";
import type { ClassificationRule, ClassificationRuleSet, ReportingStandard, StatementCategory } from "../../hub/entities/classification-rule.js";
import type { AccountType } from "../../../shared/types.js";
import type { IClassificationRuleRepo } from "../../../slices/hub/ports/classification-rule-repo.js";

export class DrizzleClassificationRuleRepo implements IClassificationRuleRepo {
  constructor(private readonly tx: TenantTx) { }

  async findByStandard(
    standard: ReportingStandard,
    version?: number,
  ): Promise<Result<ClassificationRuleSet>> {
    const conditions = version
      ? and(
          eq(classificationRuleSets.standard, standard),
          eq(classificationRuleSets.version, version),
        )
      : eq(classificationRuleSets.standard, standard);

    const [setRow] = await this.tx
      .select()
      .from(classificationRuleSets)
      .where(conditions)
      .orderBy(desc(classificationRuleSets.version))
      .limit(1);

    if (!setRow) return err(new NotFoundError("ClassificationRuleSet", `${standard}/v${version ?? "latest"}`));

    const ruleRows = await this.tx
      .select()
      .from(classificationRules)
      .where(eq(classificationRules.ruleSetId, setRow.id!));

    return ok({
      standard: setRow.standard as ReportingStandard,
      version: setRow.version,
      effectiveFrom: setRow.createdAt,
      rules: ruleRows.map((r) => this.mapRule(r, setRow)),
    });
  }

  async findAll(pagination?: PaginationParams): Promise<Result<PaginatedResult<ClassificationRuleSet>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 20;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.tx
      .select({ total: count() })
      .from(classificationRuleSets);

    const setRows = await this.tx
      .select()
      .from(classificationRuleSets)
      .orderBy(desc(classificationRuleSets.version))
      .limit(limit)
      .offset(offset);

    const data: ClassificationRuleSet[] = [];
    for (const setRow of setRows) {
      const ruleRows = await this.tx
        .select()
        .from(classificationRules)
        .where(eq(classificationRules.ruleSetId, setRow.id!));

      data.push({
        standard: setRow.standard as ReportingStandard,
        version: setRow.version,
        effectiveFrom: setRow.createdAt,
        rules: ruleRows.map((r) => this.mapRule(r, setRow)),
      });
    }

    return ok({ data, total: totalRow?.total ?? 0, page, limit });
  }

  async findRuleById(id: string): Promise<Result<ClassificationRule>> {
    const [row] = await this.tx
      .select()
      .from(classificationRules)
      .where(eq(classificationRules.id, id))
      .limit(1);

    if (!row) return err(new NotFoundError("ClassificationRule", id));

    const [setRow] = await this.tx
      .select()
      .from(classificationRuleSets)
      .where(eq(classificationRuleSets.id, row.ruleSetId))
      .limit(1);

    if (!setRow) return err(new NotFoundError("ClassificationRuleSet", row.ruleSetId));

    return ok(this.mapRule(row, setRow));
  }

  private mapRule(
    row: typeof classificationRules.$inferSelect,
    setRow: typeof classificationRuleSets.$inferSelect,
  ): ClassificationRule {
    return {
      id: row.id!,
      standard: setRow.standard as ReportingStandard,
      version: setRow.version,
      accountType: row.accountType as AccountType,
      accountCodePattern: row.pattern || undefined,
      statementCategory: row.category as StatementCategory,
      effectiveFrom: setRow.createdAt,
      createdBy: "system",
      createdAt: row.createdAt,
    };
  }
}
