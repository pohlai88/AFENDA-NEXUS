/**
 * @afenda/api — Fastify REST API server.
 *
 * Composes modules, registers routes, starts HTTP server.
 */
import './tracing.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { loadConfig, createLogger } from '@afenda/platform';
import {
  createPooledClient,
  createReadOnlyClient,
  createDbSession,
  createHealthCheck,
} from '@afenda/db';
import {
  createFinanceRuntime,
  createAuthorizationPolicy,
  registerDocumentRoutes,
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
  registerDashboardRoutes,
  registerFinInstrumentRoutes,
  registerHedgeRoutes,
  registerIntangibleRoutes,
  registerDeferredTaxRoutes,
  registerTransferPricingRoutes,
  registerApprovalRoutes,
  registerErrorHandler,
  registerBigIntSerializer,
} from '@afenda/finance/infra';
import { createR2Adapter, createMockObjectStore, loadR2Config } from '@afenda/storage';
import { registerHealthRoutes } from './routes/health.js';
import { tenantContextPlugin } from './middleware/tenant-context.js';
import { authPlugin } from './middleware/auth.js';
import { requestLoggingPlugin } from './middleware/request-logging.js';

const logger = createLogger({ level: 'info', service: 'afenda-api' });

async function main(): Promise<void> {
  logger.info('Starting Afenda API server...');

  // 1. Load config
  const config = await loadConfig();

  // 2. Create DB client + session
  const dbOpts = {
    connectionString: config.DATABASE_URL,
    sslMode: config.DATABASE_SSL_MODE,
  };
  const db = createPooledClient(dbOpts);
  const dbReadOnly =
    config.DATABASE_URL_READONLY &&
    createReadOnlyClient({
      connectionString: config.DATABASE_URL_READONLY,
      sslMode: config.DATABASE_SSL_MODE,
    });
  const session = createDbSession({ db });
  const readOnlySession = dbReadOnly ? createDbSession({ db: dbReadOnly }) : null;

  // 3. Create finance runtime (composition root)
  const financeRuntime = createFinanceRuntime({ session, readOnlySession });

  // 3b. Create authorization policy (route-level RBAC enforcement)
  const authPolicy = createAuthorizationPolicy(session);

  // 4. Build Fastify instance
  const app = Fastify({ logger: false });

  // 5. Register global plugins
  registerErrorHandler(app);
  registerBigIntSerializer(app);
  await app.register(cors, {
    origin: [
      config.APP_URL ?? `http://localhost:${config.PORT_WEB}`,
      /\.afenda\.(io|dev)$/,
    ],
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(tenantContextPlugin);
  await app.register(requestLoggingPlugin(logger));
  await app.register(authPlugin(config));

  // 6. Register routes
  await registerHealthRoutes(app, createHealthCheck(db));
  registerJournalRoutes(app, financeRuntime, authPolicy);
  registerAccountRoutes(app, financeRuntime, authPolicy);
  registerPeriodRoutes(app, financeRuntime, authPolicy);
  registerBalanceRoutes(app, financeRuntime, authPolicy);
  registerIcRoutes(app, financeRuntime, authPolicy);
  registerIcAgreementRoutes(app, financeRuntime, authPolicy);
  registerLedgerRoutes(app, financeRuntime, authPolicy);
  registerFxRateRoutes(app, financeRuntime, authPolicy);
  registerRecurringTemplateRoutes(app, financeRuntime, authPolicy);
  registerBudgetRoutes(app, financeRuntime, authPolicy);
  registerReportRoutes(app, financeRuntime, authPolicy);
  registerSettlementRoutes(app, financeRuntime, authPolicy);
  registerClassificationRuleRoutes(app, financeRuntime, authPolicy);
  registerFxRateApprovalRoutes(app, financeRuntime, authPolicy);
  registerRevenueRoutes(app, financeRuntime, authPolicy);

  // Phase 2: AP / AR / Tax / Fixed Assets / Bank
  registerApInvoiceRoutes(app, financeRuntime, authPolicy);
  registerApPaymentRunRoutes(app, financeRuntime, authPolicy);
  registerApAgingRoutes(app, financeRuntime, authPolicy);
  registerArInvoiceRoutes(app, financeRuntime, authPolicy);
  registerArPaymentRoutes(app, financeRuntime, authPolicy);
  registerArDunningRoutes(app, financeRuntime, authPolicy);
  registerArAgingRoutes(app, financeRuntime, authPolicy);
  registerTaxCodeRoutes(app, financeRuntime, authPolicy);
  registerTaxRateRoutes(app, financeRuntime, authPolicy);
  registerTaxReturnRoutes(app, financeRuntime, authPolicy);
  registerWhtCertificateRoutes(app, financeRuntime, authPolicy);
  registerAssetRoutes(app, financeRuntime, authPolicy);
  registerBankRoutes(app, financeRuntime, authPolicy);

  // Phase 3: Credit / Expense / Project
  registerCreditRoutes(app, financeRuntime, authPolicy);
  registerExpenseRoutes(app, financeRuntime, authPolicy);
  registerProjectRoutes(app, financeRuntime, authPolicy);

  // Phase 4: Lease / Provision / Treasury
  registerLeaseRoutes(app, financeRuntime, authPolicy);
  registerProvisionRoutes(app, financeRuntime, authPolicy);
  registerTreasuryRoutes(app, financeRuntime, authPolicy);

  // Phase 5: Consolidation / Cost Accounting
  registerConsolidationRoutes(app, financeRuntime, authPolicy);
  registerConsolidationExtRoutes(app, financeRuntime, authPolicy);
  registerCostAccountingRoutes(app, financeRuntime, authPolicy);

  // Phase 7: Fin-Instruments / Hedge / Intangibles / Deferred Tax / Transfer Pricing
  registerFinInstrumentRoutes(app, financeRuntime, authPolicy);
  registerHedgeRoutes(app, financeRuntime, authPolicy);
  registerIntangibleRoutes(app, financeRuntime, authPolicy);
  registerDeferredTaxRoutes(app, financeRuntime, authPolicy);
  registerTransferPricingRoutes(app, financeRuntime, authPolicy);

  // GAP-A2: Approval Workflow
  registerApprovalRoutes(app, financeRuntime, authPolicy);

  // Dashboard
  registerDashboardRoutes(app, financeRuntime, authPolicy);

  // Document Storage (R2)
  const r2Config = loadR2Config(process.env as Record<string, string>);
  const objectStore =
    r2Config.R2_TEST_ENABLED === 'true' || !r2Config.R2_ACCOUNT_ID || !r2Config.R2_ACCESS_KEY_ID
      ? createMockObjectStore()
      : createR2Adapter(r2Config);
  registerDocumentRoutes(app, session, objectStore, authPolicy);

  // 7. Start server
  const address = await app.listen({ port: config.PORT_API, host: '0.0.0.0' });
  logger.info(`API server ready on ${address}`);
}

main().catch((err) => {
  logger.error('Fatal error', { error: String(err) });
  process.exit(1);
});
