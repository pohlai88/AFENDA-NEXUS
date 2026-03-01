/**
 * @afenda/api — buildApp() factory.
 *
 * Builds the Fastify instance with all plugins, middleware, and routes
 * but does NOT call app.listen(). This enables:
 *   1. Normal server startup (index.ts calls buildApp then listen)
 *   2. Offline OpenAPI spec generation (gen-openapi.mjs calls buildApp then swagger())
 *   3. Testing (inject requests without starting a server)
 */
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { registerErrorHandler, registerBigIntSerializer, registerGlobalRateLimit } from '@afenda/api-kit';
import type { AppConfig } from '@afenda/platform';
import type { DbClient, DbSession as DbSessionType } from '@afenda/db';
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
  registerSupplierRoutes,
  registerSupplierMdmRoutes,
  registerApHoldRoutes,
  registerApTriageRoutes,
  registerApMatchToleranceRoutes,
  registerApSupplierReconRoutes,
  registerApReportingRoutes,
  registerApCaptureRoutes,
  registerSupplierPortalRoutes,
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
  DocumentAttachmentService,
} from '@afenda/finance/infra';
import { createR2Adapter, createMockObjectStore, loadR2Config } from '@afenda/storage';
import { registerHealthRoutes } from './routes/health.js';
import { registerKernelSettingsRoutes } from './routes/kernel-settings.js';
import { registerKernelAdminRoutes } from './routes/kernel-admin.js';
import { registerFinanceDashboardRoutes } from './routes/finance-dashboard.js';
import { tenantContextPlugin } from './middleware/tenant-context.js';
import { authPlugin } from './middleware/auth.js';
import { requestLoggingPlugin } from './middleware/request-logging.js';
import type { Logger } from '@afenda/platform';

export interface BuildAppDeps {
  config: AppConfig;
  db: DbClient;
  session: DbSessionType;
  readOnlySession: DbSessionType | null;
  healthCheck: () => Promise<void>;
  logger: Logger;
}

export async function buildApp(deps: BuildAppDeps) {
  const { config, session, readOnlySession, healthCheck, logger } = deps;

  // 1. Create finance runtime (composition root)
  const financeRuntime = createFinanceRuntime({ session, readOnlySession });
  const authPolicy = createAuthorizationPolicy(session);

  // 2. Build Fastify instance
  const app = Fastify({ logger: false });

  // 3. Register global plugins — error handling + serialization from @afenda/api-kit
  registerErrorHandler(app);
  registerBigIntSerializer(app);

  // 4. OpenAPI spec via @fastify/swagger
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Afenda API',
        description: 'ERP SaaS REST API — finance, accounting, treasury',
        version: '1.0.0',
      },
      servers: [{ url: 'https://api.afenda.io' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // 5. CORS + multipart
  await app.register(cors, {
    origin: [
      config.APP_URL ?? `http://localhost:${config.PORT_WEB}`,
      /\.afenda\.(io|dev)$/,
    ],
    credentials: true,
  });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  // 6. Auth + tenant context + request logging
  await app.register(tenantContextPlugin);
  await app.register(requestLoggingPlugin(logger));
  await app.register(authPlugin(config));

  // 7. Global rate limiting (per-tenant, from @afenda/api-kit)
  registerGlobalRateLimit(app, { maxRequests: 200, windowMs: 60_000 });

  // 8. Register routes
  await registerHealthRoutes(app, healthCheck);
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
  registerSupplierRoutes(app, financeRuntime, authPolicy);
  registerSupplierMdmRoutes(app, financeRuntime, authPolicy);
  registerApHoldRoutes(app, financeRuntime, authPolicy);
  registerApTriageRoutes(app, financeRuntime, authPolicy);
  registerApMatchToleranceRoutes(app, financeRuntime, authPolicy);
  registerApSupplierReconRoutes(app, financeRuntime, authPolicy);
  registerApReportingRoutes(app, financeRuntime, authPolicy);
  registerApCaptureRoutes(app, financeRuntime, authPolicy);
  registerSupplierPortalRoutes(app, financeRuntime, authPolicy);
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

  // Kernel: Org Settings + User Preferences
  registerKernelSettingsRoutes(app, { db: deps.db });

  // Kernel: Platform Admin (super-admin only)
  registerKernelAdminRoutes(app, { db: deps.db });

  // Dashboard
  registerDashboardRoutes(app, financeRuntime, authPolicy);
  
  // Finance Dashboard API (unified endpoint)
  registerFinanceDashboardRoutes(app);

  // Document Storage (R2)
  const r2Config = loadR2Config(process.env as Record<string, string>);
  const objectStore =
    r2Config.R2_TEST_ENABLED === 'true' || !r2Config.R2_ACCOUNT_ID || !r2Config.R2_ACCESS_KEY_ID
      ? createMockObjectStore()
      : createR2Adapter(r2Config);
  const documentService = new DocumentAttachmentService(session, objectStore);
  registerDocumentRoutes(app, documentService, authPolicy);

  return app;
}
