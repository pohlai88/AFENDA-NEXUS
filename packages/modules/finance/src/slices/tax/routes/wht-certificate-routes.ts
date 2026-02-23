import type { FastifyInstance } from "fastify";
import type { FinanceRuntime } from "../../../app/ports/finance-runtime.js";
import { issueWhtCertificate } from "../services/issue-wht-certificate.js";

export function registerWhtCertificateRoutes(app: FastifyInstance, runtime: FinanceRuntime): void {
  app.get("/tax/wht-certificates", async (req) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const certs = await deps.whtCertificateRepo.findAll();
      return { data: certs };
    });
  });

  app.get<{ Params: { id: string } }>("/tax/wht-certificates/:id", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const cert = await deps.whtCertificateRepo.findById(req.params.id);
      if (!cert) return reply.status(404).send({ error: "WHT certificate not found" });
      return cert;
    });
  });

  app.post("/tax/wht-certificates", async (req, reply) => {
    const tenantId = (req.headers as Record<string, string>)["x-tenant-id"]!;
    const userId = (req.headers as Record<string, string>)["x-user-id"]!;
    const body = req.body as Record<string, unknown>;
    return runtime.withTenant({ tenantId, userId }, async (deps) => {
      const result = await issueWhtCertificate(
        {
          tenantId,
          userId,
          payeeId: body.payeeId as string,
          payeeName: body.payeeName as string,
          payeeType: body.payeeType as "RESIDENT" | "NON_RESIDENT",
          countryCode: body.countryCode as string,
          incomeType: body.incomeType as string,
          grossAmount: BigInt(body.grossAmount as number),
          whtAmount: BigInt(body.whtAmount as number),
          currencyCode: (body.currencyCode as string) ?? "USD",
          rateApplied: body.rateApplied as number,
          treatyRate: (body.treatyRate as number) ?? null,
          issueDate: new Date(body.issueDate as string),
          taxPeriodStart: new Date(body.taxPeriodStart as string),
          taxPeriodEnd: new Date(body.taxPeriodEnd as string),
          relatedInvoiceId: (body.relatedInvoiceId as string) ?? null,
          relatedPaymentId: (body.relatedPaymentId as string) ?? null,
        },
        deps,
      );
      if (!result.ok) return reply.status(400).send({ error: result.error });
      return reply.status(201).send(result.value);
    });
  });
}
