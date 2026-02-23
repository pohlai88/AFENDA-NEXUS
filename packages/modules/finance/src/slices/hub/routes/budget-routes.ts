import type { FastifyInstance } from "fastify";
import { BudgetEntryListQuerySchema, UpsertBudgetEntrySchema, BudgetVarianceQuerySchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { getBudgetVariance } from "../services/get-budget-variance.js";
import { mapErrorToStatus } from "../../../shared/routes/error-mapper.js";

export function registerBudgetRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /budget-entries — upsert budget entry
  app.post("/budget-entries", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return reply.status(400).send({ error: "x-user-id header required" });

    const body = UpsertBudgetEntrySchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.budgetRepo.upsert({
        tenantId,
        companyId: body.companyId,
        ledgerId: body.ledgerId,
        accountId: body.accountId,
        periodId: body.periodId,
        budgetAmount: BigInt(body.budgetAmount),
      });
    });

    return reply.status(201).send(result);
  });

  // GET /budget-entries?ledgerId=&periodId= — list
  app.get("/budget-entries", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const { ledgerId, periodId, page, limit } = BudgetEntryListQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.budgetRepo.findByLedgerAndPeriod(ledgerId, periodId, { page, limit });
    });

    return reply.send(result);
  });

  // GET /budget-variance?ledgerId=&periodId= — variance report
  app.get("/budget-variance", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const query = BudgetVarianceQuerySchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return getBudgetVariance(query, {
        budgetRepo: deps.budgetRepo,
        balanceRepo: deps.balanceRepo,
        accountRepo: deps.accountRepo,
        ledgerRepo: deps.ledgerRepo,
      });
    });

    if (!result.ok) {
      return reply.status(mapErrorToStatus(result.error)).send({ error: result.error });
    }
    return reply.send(result.value);
  });
}
