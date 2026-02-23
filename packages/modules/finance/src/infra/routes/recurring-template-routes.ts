import type { FastifyInstance } from "fastify";
import { IdParamSchema, PaginationSchema, CreateRecurringTemplateSchema } from "@afenda/contracts";
import type { FinanceRuntime } from "../../app/ports/finance-runtime.js";
import { processRecurringJournals } from "../../app/services/process-recurring-journals.js";

export function registerRecurringTemplateRoutes(
  app: FastifyInstance,
  runtime: FinanceRuntime,
): void {
  // POST /recurring-templates — create template
  app.post("/recurring-templates", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return reply.status(400).send({ error: "x-user-id header required" });

    const body = CreateRecurringTemplateSchema.parse(req.body);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.recurringTemplateRepo.create({
        tenantId,
        companyId: body.companyId,
        ledgerId: body.ledgerId,
        description: body.description,
        lines: body.lines.map((l) => ({
          accountCode: l.accountCode,
          debit: BigInt(l.debit),
          credit: BigInt(l.credit),
          description: l.description,
        })),
        frequency: body.frequency,
        nextRunDate: body.nextRunDate,
      });
    });

    return reply.status(201).send(result);
  });

  // GET /recurring-templates — paginated list
  app.get("/recurring-templates", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";
    const pagination = PaginationSchema.parse(req.query);

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.recurringTemplateRepo.findAll(pagination);
    });

    return reply.send(result);
  });

  // GET /recurring-templates/:id
  app.get("/recurring-templates/:id", async (req, reply) => {
    const { id } = IdParamSchema.parse(req.params);
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = (req.headers["x-user-id"] as string) ?? "system";

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return deps.recurringTemplateRepo.findById(id);
    });

    if (!result) return reply.status(404).send({ error: "RecurringTemplate not found" });
    return reply.send(result);
  });

  // POST /recurring-templates/process — trigger processing
  app.post("/recurring-templates/process", async (req, reply) => {
    const tenantId = req.headers["x-tenant-id"] as string;
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return reply.status(400).send({ error: "x-user-id header required" });

    const result = await runtime.withTenant({ tenantId, userId }, async (deps) => {
      return processRecurringJournals(
        { tenantId, userId, asOfDate: new Date() },
        {
          recurringTemplateRepo: deps.recurringTemplateRepo,
          journalRepo: deps.journalRepo,
          accountRepo: deps.accountRepo,
          periodRepo: deps.periodRepo,
          outboxWriter: deps.outboxWriter,
          journalAuditRepo: deps.journalAuditRepo,
        },
      );
    });

    if (!result.ok) return reply.status(500).send({ error: result.error });
    return reply.send(result.value);
  });
}
