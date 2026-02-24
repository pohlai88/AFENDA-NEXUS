/**
 * @afenda/api — Fastify REST API server.
 *
 * Composes modules, registers routes, starts HTTP server.
 */
import Fastify from "fastify";
import { loadConfig, createLogger } from "@afenda/platform";
import { createPooledClient, createDbSession, createHealthCheck } from "@afenda/db";
import {
  createFinanceRuntime,
  registerJournalRoutes,
  registerAccountRoutes,
  registerPeriodRoutes,
  registerBalanceRoutes,
  registerIcRoutes,
  registerIcAgreementRoutes,
  registerLedgerRoutes,
  registerFxRateRoutes,
  registerRecurringTemplateRoutes,
  registerBudgetRoutes,
  registerReportRoutes,
  registerSettlementRoutes,
  registerClassificationRuleRoutes,
  registerFxRateApprovalRoutes,
  registerRevenueRoutes,
  registerApInvoiceRoutes,
  registerApPaymentRunRoutes,
  registerApAgingRoutes,
  registerArInvoiceRoutes,
  registerArPaymentRoutes,
  registerArDunningRoutes,
  registerArAgingRoutes,
  registerTaxCodeRoutes,
  registerTaxRateRoutes,
  registerTaxReturnRoutes,
  registerWhtCertificateRoutes,
  registerAssetRoutes,
  registerBankRoutes,
  registerCreditRoutes,
  registerExpenseRoutes,
  registerProjectRoutes,
  registerLeaseRoutes,
  registerProvisionRoutes,
  registerTreasuryRoutes,
  registerConsolidationRoutes,
  registerConsolidationExtRoutes,
  registerCostAccountingRoutes,
  registerFinInstrumentRoutes,
  registerHedgeRoutes,
  registerIntangibleRoutes,
  registerDeferredTaxRoutes,
  registerTransferPricingRoutes,
  registerErrorHandler,
  registerBigIntSerializer,
} from "@afenda/finance/infra";
import { registerHealthRoutes } from "./routes/health.js";
import { tenantContextPlugin } from "./middleware/tenant-context.js";
import { authPlugin } from "./middleware/auth.js";
import { requestLoggingPlugin } from "./middleware/request-logging.js";

const logger = createLogger({ level: "info", service: "afenda-api" });

async function main(): Promise<void> {
  logger.info("Starting Afenda API server...");

  // 1. Load config
  const config = await loadConfig();

  // 2. Create DB client + session
  const db = createPooledClient({ connectionString: config.DATABASE_URL });
  const session = createDbSession({ db });

  // 3. Create finance runtime (composition root)
  const financeRuntime = createFinanceRuntime(session);

  // 4. Build Fastify instance
  const app = Fastify({ logger: false });

  // 5. Register global plugins
  registerErrorHandler(app);
  registerBigIntSerializer(app);
  await app.register(tenantContextPlugin);
  await app.register(requestLoggingPlugin(logger));
  await app.register(authPlugin(config));

  // 6. Register routes
  await registerHealthRoutes(app, createHealthCheck(db));
  registerJournalRoutes(app, financeRuntime);
  registerAccountRoutes(app, financeRuntime);
  registerPeriodRoutes(app, financeRuntime);
  registerBalanceRoutes(app, financeRuntime);
  registerIcRoutes(app, financeRuntime);
  registerIcAgreementRoutes(app, financeRuntime);
  registerLedgerRoutes(app, financeRuntime);
  registerFxRateRoutes(app, financeRuntime);
  registerRecurringTemplateRoutes(app, financeRuntime);
  registerBudgetRoutes(app, financeRuntime);
  registerReportRoutes(app, financeRuntime);
  registerSettlementRoutes(app, financeRuntime);
  registerClassificationRuleRoutes(app, financeRuntime);
  registerFxRateApprovalRoutes(app, financeRuntime);
  registerRevenueRoutes(app, financeRuntime);

  // Phase 2: AP / AR / Tax / Fixed Assets / Bank
  registerApInvoiceRoutes(app, financeRuntime);
  registerApPaymentRunRoutes(app, financeRuntime);
  registerApAgingRoutes(app, financeRuntime);
  registerArInvoiceRoutes(app, financeRuntime);
  registerArPaymentRoutes(app, financeRuntime);
  registerArDunningRoutes(app, financeRuntime);
  registerArAgingRoutes(app, financeRuntime);
  registerTaxCodeRoutes(app, financeRuntime);
  registerTaxRateRoutes(app, financeRuntime);
  registerTaxReturnRoutes(app, financeRuntime);
  registerWhtCertificateRoutes(app, financeRuntime);
  registerAssetRoutes(app, financeRuntime);
  registerBankRoutes(app, financeRuntime);

  // Phase 3: Credit / Expense / Project
  registerCreditRoutes(app, financeRuntime);
  registerExpenseRoutes(app, financeRuntime);
  registerProjectRoutes(app, financeRuntime);

  // Phase 4: Lease / Provision / Treasury
  registerLeaseRoutes(app, financeRuntime);
  registerProvisionRoutes(app, financeRuntime);
  registerTreasuryRoutes(app, financeRuntime);

  // Phase 5: Consolidation / Cost Accounting
  registerConsolidationRoutes(app, financeRuntime);
  registerConsolidationExtRoutes(app, financeRuntime);
  registerCostAccountingRoutes(app, financeRuntime);

  // Phase 7: Fin-Instruments / Hedge / Intangibles / Deferred Tax / Transfer Pricing
  registerFinInstrumentRoutes(app, financeRuntime);
  registerHedgeRoutes(app, financeRuntime);
  registerIntangibleRoutes(app, financeRuntime);
  registerDeferredTaxRoutes(app, financeRuntime);
  registerTransferPricingRoutes(app, financeRuntime);

  // 7. Start server
  const address = await app.listen({ port: config.PORT_API, host: "0.0.0.0" });
  logger.info(`API server ready on ${address}`);
}

main().catch((err) => {
  logger.error("Fatal error", { error: String(err) });
  process.exit(1);
});
