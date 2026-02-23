# Phase 0 — Move finance files into slice structure
# Run from repo root: .\tools\scripts\phase0-refactor.ps1
# Prerequisites: git status clean, pnpm typecheck passes
#
# Strategy: "Strangler Fig"
# 1. git mv files to new locations
# 2. Old barrel files (domain/index.ts, calculators/index.ts) become re-export shims
# 3. Typecheck passes immediately (old import paths still resolve via shims)
# 4. Then update consumers to import from new paths
# 5. Delete shims when all consumers migrated

$ErrorActionPreference = "Stop"
$base = "packages\modules\finance\src"

Write-Host "=== Phase 0: Finance Slice Refactor ===" -ForegroundColor Cyan

# ─── Step 1: Shared (cross-cutting, no inbound deps) ─────────────────────────
Write-Host "`n--- Moving shared/ files ---" -ForegroundColor Yellow

# Ports
git mv "$base\app\ports\idempotency-store.ts"       "$base\shared\ports\idempotency-store.ts"
git mv "$base\app\ports\outbox-writer.ts"            "$base\shared\ports\outbox-writer.ts"
git mv "$base\app\ports\authorization.ts"            "$base\shared\ports\authorization.ts"

# Repos
git mv "$base\infra\repositories\drizzle-idempotency.ts"   "$base\shared\repos\drizzle-idempotency.ts"
git mv "$base\infra\repositories\drizzle-outbox-writer.ts"  "$base\shared\repos\drizzle-outbox-writer.ts"

# Routes (cross-cutting)
git mv "$base\infra\routes\error-mapper.ts"           "$base\shared\routes\error-mapper.ts"
git mv "$base\infra\routes\fastify-plugins.ts"        "$base\shared\routes\fastify-plugins.ts"
git mv "$base\infra\routes\authorization-guard.ts"    "$base\shared\routes\authorization-guard.ts"
git mv "$base\infra\routes\rate-limit-guard.ts"       "$base\shared\routes\rate-limit-guard.ts"

# Authorization
git mv "$base\infra\authorization\default-authorization-policy.ts" "$base\shared\authorization\default-authorization-policy.ts"

# Mappers
git mv "$base\infra\mappers\account-mapper.ts"  "$base\shared\mappers\account-mapper.ts"
git mv "$base\infra\mappers\journal-mapper.ts"  "$base\shared\mappers\journal-mapper.ts"
git mv "$base\infra\mappers\period-mapper.ts"   "$base\shared\mappers\period-mapper.ts"

# Domain-level shared files
git mv "$base\domain\currency-config.ts"   "$base\shared\currency-config.ts"
git mv "$base\domain\events.ts"            "$base\shared\events.ts"
git mv "$base\domain\finance-context.ts"   "$base\shared\finance-context.ts"

Write-Host "  shared/ done (16 files)" -ForegroundColor Green

# ─── Step 2: FX slice (smallest, 12 files) ───────────────────────────────────
Write-Host "`n--- Moving slices/fx/ files ---" -ForegroundColor Yellow

git mv "$base\domain\entities\fx-rate.ts"              "$base\slices\fx\entities\fx-rate.ts"
git mv "$base\domain\entities\fx-rate-approval.ts"     "$base\slices\fx\entities\fx-rate-approval.ts"
git mv "$base\domain\calculators\fx-convert.ts"        "$base\slices\fx\calculators\fx-convert.ts"
git mv "$base\domain\calculators\fx-revaluation.ts"    "$base\slices\fx\calculators\fx-revaluation.ts"
git mv "$base\domain\calculators\fx-translation.ts"    "$base\slices\fx\calculators\fx-translation.ts"
git mv "$base\domain\calculators\fx-triangulation.ts"  "$base\slices\fx\calculators\fx-triangulation.ts"
git mv "$base\app\ports\fx-rate-repo.ts"               "$base\slices\fx\ports\fx-rate-repo.ts"
git mv "$base\app\ports\fx-rate-approval-repo.ts"      "$base\slices\fx\ports\fx-rate-approval-repo.ts"
git mv "$base\infra\repositories\drizzle-fx-rate-repo.ts"          "$base\slices\fx\repos\drizzle-fx-rate-repo.ts"
git mv "$base\infra\repositories\drizzle-fx-rate-approval-repo.ts" "$base\slices\fx\repos\drizzle-fx-rate-approval-repo.ts"
git mv "$base\infra\routes\fx-rate-routes.ts"          "$base\slices\fx\routes\fx-rate-routes.ts"
git mv "$base\infra\routes\fx-rate-approval-routes.ts" "$base\slices\fx\routes\fx-rate-approval-routes.ts"

Write-Host "  slices/fx/ done (12 files)" -ForegroundColor Green

# ─── Step 3: IC slice (13 files) ─────────────────────────────────────────────
Write-Host "`n--- Moving slices/ic/ files ---" -ForegroundColor Yellow

git mv "$base\domain\entities\intercompany.ts"     "$base\slices\ic\entities\intercompany.ts"
git mv "$base\domain\entities\ic-settlement.ts"    "$base\slices\ic\entities\ic-settlement.ts"
git mv "$base\domain\calculators\ic-elimination.ts" "$base\slices\ic\calculators\ic-elimination.ts"
git mv "$base\domain\calculators\ic-aging.ts"      "$base\slices\ic\calculators\ic-aging.ts"
git mv "$base\app\ports\ic-repo.ts"                "$base\slices\ic\ports\ic-repo.ts"
git mv "$base\app\ports\ic-settlement-repo.ts"     "$base\slices\ic\ports\ic-settlement-repo.ts"
git mv "$base\app\services\create-ic-transaction.ts" "$base\slices\ic\services\create-ic-transaction.ts"
git mv "$base\app\services\settle-ic-documents.ts"   "$base\slices\ic\services\settle-ic-documents.ts"
git mv "$base\infra\repositories\drizzle-ic-repo.ts"           "$base\slices\ic\repos\drizzle-ic-repo.ts"
git mv "$base\infra\repositories\drizzle-ic-settlement-repo.ts" "$base\slices\ic\repos\drizzle-ic-settlement-repo.ts"
git mv "$base\infra\routes\ic-routes.ts"            "$base\slices\ic\routes\ic-routes.ts"
git mv "$base\infra\routes\ic-agreement-routes.ts"  "$base\slices\ic\routes\ic-agreement-routes.ts"
git mv "$base\infra\routes\settlement-routes.ts"    "$base\slices\ic\routes\settlement-routes.ts"

Write-Host "  slices/ic/ done (13 files)" -ForegroundColor Green

# ─── Step 4: Hub slice (25 files) ────────────────────────────────────────────
Write-Host "`n--- Moving slices/hub/ files ---" -ForegroundColor Yellow

git mv "$base\domain\entities\classification-rule.ts"   "$base\slices\hub\entities\classification-rule.ts"
git mv "$base\domain\entities\revenue-recognition.ts"   "$base\slices\hub\entities\revenue-recognition.ts"
git mv "$base\domain\entities\budget.ts"                "$base\slices\hub\entities\budget.ts"
git mv "$base\domain\entities\recurring-template.ts"    "$base\slices\hub\entities\recurring-template.ts"
git mv "$base\domain\calculators\derivation-engine.ts"  "$base\slices\hub\calculators\derivation-engine.ts"
git mv "$base\domain\calculators\accrual-engine.ts"     "$base\slices\hub\calculators\accrual-engine.ts"
git mv "$base\domain\calculators\revenue-recognition.ts" "$base\slices\hub\calculators\revenue-recognition.ts"
git mv "$base\domain\calculators\deferred-revenue.ts"   "$base\slices\hub\calculators\deferred-revenue.ts"
git mv "$base\domain\calculators\variance-alerts.ts"    "$base\slices\hub\calculators\variance-alerts.ts"
git mv "$base\app\ports\classification-rule-repo.ts"    "$base\slices\hub\ports\classification-rule-repo.ts"
git mv "$base\app\ports\revenue-contract-repo.ts"       "$base\slices\hub\ports\revenue-contract-repo.ts"
git mv "$base\app\ports\budget-repo.ts"                 "$base\slices\hub\ports\budget-repo.ts"
git mv "$base\app\ports\recurring-template-repo.ts"     "$base\slices\hub\ports\recurring-template-repo.ts"
git mv "$base\app\services\recognize-revenue.ts"        "$base\slices\hub\services\recognize-revenue.ts"
git mv "$base\app\services\get-budget-variance.ts"      "$base\slices\hub\services\get-budget-variance.ts"
git mv "$base\app\services\consolidate.ts"              "$base\slices\hub\services\consolidate.ts"
git mv "$base\infra\repositories\drizzle-classification-rule-repo.ts" "$base\slices\hub\repos\drizzle-classification-rule-repo.ts"
git mv "$base\infra\repositories\drizzle-revenue-contract-repo.ts"    "$base\slices\hub\repos\drizzle-revenue-contract-repo.ts"
git mv "$base\infra\repositories\drizzle-budget-repo.ts"              "$base\slices\hub\repos\drizzle-budget-repo.ts"
git mv "$base\infra\repositories\drizzle-recurring-template-repo.ts"  "$base\slices\hub\repos\drizzle-recurring-template-repo.ts"
git mv "$base\infra\routes\classification-rule-routes.ts" "$base\slices\hub\routes\classification-rule-routes.ts"
git mv "$base\infra\routes\revenue-routes.ts"             "$base\slices\hub\routes\revenue-routes.ts"
git mv "$base\infra\routes\budget-routes.ts"              "$base\slices\hub\routes\budget-routes.ts"
git mv "$base\infra\routes\recurring-template-routes.ts"  "$base\slices\hub\routes\recurring-template-routes.ts"
git mv "$base\infra\routes\consolidation-routes.ts"       "$base\slices\hub\routes\consolidation-routes.ts"

Write-Host "  slices/hub/ done (25 files)" -ForegroundColor Green

# ─── Step 5: Reporting slice (11 files) ──────────────────────────────────────
Write-Host "`n--- Moving slices/reporting/ files ---" -ForegroundColor Yellow

git mv "$base\domain\entities\financial-reports.ts"      "$base\slices\reporting\entities\financial-reports.ts"
git mv "$base\domain\calculators\report-classifier.ts"   "$base\slices\reporting\calculators\report-classifier.ts"
git mv "$base\domain\calculators\cash-flow-indirect.ts"  "$base\slices\reporting\calculators\cash-flow-indirect.ts"
git mv "$base\domain\calculators\comparative-report.ts"  "$base\slices\reporting\calculators\comparative-report.ts"
git mv "$base\domain\calculators\close-checklist.ts"     "$base\slices\reporting\calculators\close-checklist.ts"
git mv "$base\app\services\get-balance-sheet.ts"         "$base\slices\reporting\services\get-balance-sheet.ts"
git mv "$base\app\services\get-income-statement.ts"      "$base\slices\reporting\services\get-income-statement.ts"
git mv "$base\app\services\get-cash-flow.ts"             "$base\slices\reporting\services\get-cash-flow.ts"
git mv "$base\app\services\get-comparative-balance-sheet.ts"     "$base\slices\reporting\services\get-comparative-balance-sheet.ts"
git mv "$base\app\services\get-comparative-income-statement.ts"  "$base\slices\reporting\services\get-comparative-income-statement.ts"
git mv "$base\infra\routes\report-routes.ts"             "$base\slices\reporting\routes\report-routes.ts"

Write-Host "  slices/reporting/ done (11 files)" -ForegroundColor Green

# ─── Step 6: GL slice (41 files — largest, moved last) ───────────────────────
Write-Host "`n--- Moving slices/gl/ files ---" -ForegroundColor Yellow

# Entities
git mv "$base\domain\entities\journal.ts"        "$base\slices\gl\entities\journal.ts"
git mv "$base\domain\entities\account.ts"        "$base\slices\gl\entities\account.ts"
git mv "$base\domain\entities\fiscal-period.ts"  "$base\slices\gl\entities\fiscal-period.ts"
git mv "$base\domain\entities\gl-balance.ts"     "$base\slices\gl\entities\gl-balance.ts"
git mv "$base\domain\entities\ledger.ts"         "$base\slices\gl\entities\ledger.ts"
git mv "$base\domain\entities\journal-audit.ts"  "$base\slices\gl\entities\journal-audit.ts"

# Calculators
git mv "$base\domain\calculators\journal-balance.ts"    "$base\slices\gl\calculators\journal-balance.ts"
git mv "$base\domain\calculators\coa-hierarchy.ts"      "$base\slices\gl\calculators\coa-hierarchy.ts"
git mv "$base\domain\calculators\trial-balance.ts"      "$base\slices\gl\calculators\trial-balance.ts"
git mv "$base\domain\calculators\segment-dimension.ts"  "$base\slices\gl\calculators\segment-dimension.ts"

# Ports
git mv "$base\app\ports\journal-repo.ts"              "$base\slices\gl\ports\journal-repo.ts"
git mv "$base\app\ports\account-repo.ts"              "$base\slices\gl\ports\account-repo.ts"
git mv "$base\app\ports\fiscal-period-repo.ts"        "$base\slices\gl\ports\fiscal-period-repo.ts"
git mv "$base\app\ports\gl-balance-repo.ts"           "$base\slices\gl\ports\gl-balance-repo.ts"
git mv "$base\app\ports\ledger-repo.ts"               "$base\slices\gl\ports\ledger-repo.ts"
git mv "$base\app\ports\journal-audit-repo.ts"        "$base\slices\gl\ports\journal-audit-repo.ts"
git mv "$base\app\ports\period-audit-repo.ts"         "$base\slices\gl\ports\period-audit-repo.ts"
git mv "$base\app\ports\document-number-generator.ts" "$base\slices\gl\ports\document-number-generator.ts"

# Services
git mv "$base\app\services\create-journal.ts"             "$base\slices\gl\services\create-journal.ts"
git mv "$base\app\services\post-journal.ts"               "$base\slices\gl\services\post-journal.ts"
git mv "$base\app\services\get-journal.ts"                "$base\slices\gl\services\get-journal.ts"
git mv "$base\app\services\reverse-journal.ts"            "$base\slices\gl\services\reverse-journal.ts"
git mv "$base\app\services\void-journal.ts"               "$base\slices\gl\services\void-journal.ts"
git mv "$base\app\services\get-trial-balance.ts"          "$base\slices\gl\services\get-trial-balance.ts"
git mv "$base\app\services\close-period.ts"               "$base\slices\gl\services\close-period.ts"
git mv "$base\app\services\lock-period.ts"                "$base\slices\gl\services\lock-period.ts"
git mv "$base\app\services\reopen-period.ts"              "$base\slices\gl\services\reopen-period.ts"
git mv "$base\app\services\close-year.ts"                 "$base\slices\gl\services\close-year.ts"
git mv "$base\app\services\process-recurring-journals.ts" "$base\slices\gl\services\process-recurring-journals.ts"

# Repos
git mv "$base\infra\repositories\drizzle-journal-repo.ts"              "$base\slices\gl\repos\drizzle-journal-repo.ts"
git mv "$base\infra\repositories\drizzle-account-repo.ts"              "$base\slices\gl\repos\drizzle-account-repo.ts"
git mv "$base\infra\repositories\drizzle-period-repo.ts"               "$base\slices\gl\repos\drizzle-period-repo.ts"
git mv "$base\infra\repositories\drizzle-balance-repo.ts"              "$base\slices\gl\repos\drizzle-balance-repo.ts"
git mv "$base\infra\repositories\drizzle-journal-audit-repo.ts"        "$base\slices\gl\repos\drizzle-journal-audit-repo.ts"
git mv "$base\infra\repositories\drizzle-period-audit-repo.ts"         "$base\slices\gl\repos\drizzle-period-audit-repo.ts"
git mv "$base\infra\repositories\drizzle-document-number-generator.ts" "$base\slices\gl\repos\drizzle-document-number-generator.ts"
git mv "$base\infra\repositories\drizzle-ledger-repo.ts"               "$base\slices\gl\repos\drizzle-ledger-repo.ts"

# Routes
git mv "$base\infra\routes\journal-routes.ts"  "$base\slices\gl\routes\journal-routes.ts"
git mv "$base\infra\routes\account-routes.ts"  "$base\slices\gl\routes\account-routes.ts"
git mv "$base\infra\routes\period-routes.ts"   "$base\slices\gl\routes\period-routes.ts"
git mv "$base\infra\routes\balance-routes.ts"  "$base\slices\gl\routes\balance-routes.ts"
git mv "$base\infra\routes\ledger-routes.ts"   "$base\slices\gl\routes\ledger-routes.ts"

Write-Host "  slices/gl/ done (41 files)" -ForegroundColor Green

# ─── Step 7: Move runtime ────────────────────────────────────────────────────
Write-Host "`n--- Moving runtime ---" -ForegroundColor Yellow
git mv "$base\infra\drizzle-finance-runtime.ts" "$base\runtime.ts"
Write-Host "  runtime.ts done" -ForegroundColor Green

# ─── Summary ─────────────────────────────────────────────────────────────────
Write-Host "`n=== Move complete: 119 files moved ===" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Rewrite domain/index.ts + domain/calculators/index.ts as re-export shims" -ForegroundColor White
Write-Host "  2. Rewrite app/ports/finance-runtime.ts as re-export shim" -ForegroundColor White
Write-Host "  3. Fix internal imports in moved files" -ForegroundColor White
Write-Host "  4. pnpm typecheck (must pass)" -ForegroundColor White
Write-Host "  5. pnpm test (must pass)" -ForegroundColor White
