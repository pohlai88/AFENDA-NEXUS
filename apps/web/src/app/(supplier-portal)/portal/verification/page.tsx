/**
 * Phase 1.2.3 CAP-PROOF — Supplier Proof Chain Verification Page
 *
 * Suppliers can view the tamper-evident hash chain of all portal communications
 * related to their account. Each entry includes:
 *   - eventType / entityType / actorType
 *   - chainPosition (monotonically increasing, tenant-scoped)
 *   - SHA-256 contentHash and previousHash (for manual chain verification)
 *   - payloadSummary (human-readable event description)
 *   - eventAt timestamp
 *
 * The chain provides legal-grade tamper evidence: any modification to a prior
 * entry would break the hash chain from that point forward.
 *
 * SP-7020: /portal/verification
 */
import { Suspense } from 'react';
import { ShieldCheck, AlertTriangle, Link2, Hash, Calendar, Info } from 'lucide-react';
import { getRequestContext } from '@/lib/auth';
import { getPortalSupplier, getPortalProofChain } from '@/features/portal/queries/portal.queries';
import { PageHeader } from '@/components/erp/page-header';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/lib/constants';
import type { RequestContext } from '@afenda/core';

export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncateHash(hash: string | null, len = 12): string {
  if (!hash) return '—';
  return `${hash.slice(0, len)}…${hash.slice(-4)}`;
}

function formatEventType(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const eventTypeColors: Record<string, string> = {
  ESCALATION_TRIGGERED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  ESCALATION_RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CASE_OPENED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CASE_CLOSED: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  MESSAGE_SENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  COMPLIANCE_SUBMITTED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  DAILY_ANCHOR: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

function eventBadgeClass(eventType: string): string {
  return (
    eventTypeColors[eventType] ??
    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyProofChain() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
      <ShieldCheck className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-foreground">No proof entries yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Proof chain entries are generated automatically when significant portal events occur (e.g.,
        escalations, case actions, compliance submissions).
      </p>
    </div>
  );
}

// ─── Proof Entry Card ─────────────────────────────────────────────────────────

interface ProofEntryProps {
  position: string;
  eventType: string;
  actorType: string;
  eventAt: string;
  contentHash: string;
  previousHash: string | null;
  payloadSummary: string | null;
  isFirst: boolean;
}

function ProofEntryCard({
  position,
  eventType,
  actorType,
  eventAt,
  contentHash,
  previousHash,
  payloadSummary,
  isFirst,
}: ProofEntryProps) {
  return (
    <div className="relative flex gap-4">
      {/* Chain connector */}
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-background">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
        {!isFirst && <div className="mt-1 w-0.5 grow bg-border" aria-hidden="true" />}
      </div>

      {/* Entry content */}
      <Card className="mb-4 w-full">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${eventBadgeClass(eventType)}`}
              >
                {formatEventType(eventType)}
              </span>
              <Badge variant="outline" className="text-xs">
                #{position}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {actorType}
              </Badge>
            </div>
            <time
              dateTime={eventAt}
              className="flex items-center gap-1 text-xs text-muted-foreground"
            >
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {new Date(eventAt).toLocaleString()}
            </time>
          </div>
          {payloadSummary && (
            <CardDescription className="mt-1 text-sm">{payloadSummary}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-1.5 text-xs sm:grid-cols-2">
            <div className="flex items-start gap-1.5">
              <dt className="flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                <Hash className="h-3 w-3" aria-hidden="true" />
                Content hash
              </dt>
              <dd>
                <code
                  title={contentHash}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wider"
                >
                  {truncateHash(contentHash, 16)}
                </code>
              </dd>
            </div>
            <div className="flex items-start gap-1.5">
              <dt className="flex items-center gap-1 font-medium text-muted-foreground shrink-0">
                <Link2 className="h-3 w-3" aria-hidden="true" />
                Previous hash
              </dt>
              <dd>
                {previousHash ? (
                  <code
                    title={previousHash}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tracking-wider"
                  >
                    {truncateHash(previousHash, 16)}
                  </code>
                ) : (
                  <span className="italic text-muted-foreground">GENESIS</span>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

async function VerificationPageContent({ ctx }: { ctx: RequestContext }) {
  const supplierResult = await getPortalSupplier(ctx);
  if (!supplierResult.ok) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
        <h2 className="mt-4 text-lg font-semibold">Unable to load supplier profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">{supplierResult.error.message}</p>
      </div>
    );
  }

  const supplier = supplierResult.value;
  const result = await getPortalProofChain(ctx, supplier.supplierId);

  const entries = result.ok ? result.value.items : [];
  const total = result.ok ? result.value.total : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proof Chain Verification"
        description="Tamper-evident audit log of all portal communications. Each entry is cryptographically linked to the previous one."
        breadcrumbs={[
          { label: 'Portal', href: routes.portal.dashboard },
          { label: 'Verification' },
        ]}
      />

      {/* Info banner */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          This proof chain uses SHA-256 hashing to ensure records cannot be altered without
          detection. Each entry&apos;s <strong>content hash</strong> covers the full payload and the{' '}
          <strong>previous hash</strong>, forming an unbroken chain from the genesis record.
        </p>
      </div>

      {/* Stats row */}
      {total > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 text-sm">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {total} proof {total === 1 ? 'entry' : 'entries'}
          </Badge>
        </div>
      )}

      {/* Chain list */}
      {entries.length === 0 ? (
        <EmptyProofChain />
      ) : (
        <div className="pt-2">
          {[...entries].reverse().map((entry, idx) => (
            <ProofEntryCard
              key={entry.id}
              position={entry.chainPosition}
              eventType={entry.eventType}
              actorType={entry.actorType}
              eventAt={entry.eventAt}
              contentHash={entry.contentHash}
              previousHash={entry.previousHash}
              payloadSummary={entry.payloadSummary}
              isFirst={idx === entries.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PortalVerificationPage() {
  const ctx = await getRequestContext();

  return (
    <Suspense fallback={<LoadingSkeleton variant="cards" />}>
      <VerificationPageContent ctx={ctx} />
    </Suspense>
  );
}
