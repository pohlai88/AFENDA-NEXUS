import { Suspense } from 'react';
import { getRequestContext } from '@/lib/auth';
import {
  getSupplierContacts,
  getSupplierTaxRegistrations,
  getSupplierLegalDocs,
  getSupplierBlocks,
  getSupplierRiskIndicators,
  getSupplierEvaluations,
  getSupplierDiversity,
  getSupplierCompanyOverrides,
} from '@/features/finance/payables/queries/supplier-mdm.queries';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LoadingSkeleton } from '@/components/erp/loading-skeleton';
import { formatDate } from '@/lib/utils';
import {
  Mail, User, ShieldCheck, FileText, Ban,
  Star, Heart, Building2, CheckCircle,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// Contacts Tab
// ═══════════════════════════════════════════════════════════════════════════

async function ContactsContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierContacts(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load contacts.</p>;
  const contacts = result.value.data;
  if (contacts.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No contacts recorded.</p>;
  return (
    <Table>
      <caption className="sr-only">Supplier contacts</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Primary</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {c.firstName} {c.lastName}
              </div>
            </TableCell>
            <TableCell><Badge variant="outline">{c.role}</Badge></TableCell>
            <TableCell className="flex items-center gap-1 text-sm">
              <Mail className="h-3 w-3" />{c.email}
            </TableCell>
            <TableCell>{c.phone ?? '—'}</TableCell>
            <TableCell>{c.isPrimary ? <CheckCircle className="h-4 w-4 text-success" /> : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function ContactsTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <ContactsContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tax Registrations Tab
// ═══════════════════════════════════════════════════════════════════════════

async function TaxRegistrationsContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierTaxRegistrations(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load tax registrations.</p>;
  const regs = result.value.data;
  if (regs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No tax registrations recorded.</p>;
  return (
    <Table>
      <caption className="sr-only">Tax registrations</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Registration #</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Valid From</TableHead>
          <TableHead>Valid To</TableHead>
          <TableHead>Verified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {regs.map((r) => (
          <TableRow key={r.id}>
            <TableCell><Badge variant="secondary">{r.taxType}</Badge></TableCell>
            <TableCell className="font-mono text-sm">{r.registrationNumber}</TableCell>
            <TableCell>{r.countryCode}</TableCell>
            <TableCell>{formatDate(r.validFrom)}</TableCell>
            <TableCell>{r.validTo ? formatDate(r.validTo) : '—'}</TableCell>
            <TableCell>
              {r.verified ? (
                <div className="flex items-center gap-1 text-success text-sm">
                  <ShieldCheck className="h-4 w-4" /> Verified
                </div>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function TaxRegistrationsTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <TaxRegistrationsContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Legal Documents Tab
// ═══════════════════════════════════════════════════════════════════════════

async function LegalDocsContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierLegalDocs(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load legal documents.</p>;
  const docs = result.value.data;
  if (docs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No legal documents uploaded.</p>;
  return (
    <Table>
      <caption className="sr-only">Legal documents</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Document</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Uploaded</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((d) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {d.documentName}
              </div>
            </TableCell>
            <TableCell><Badge variant="secondary">{d.docType}</Badge></TableCell>
            <TableCell>
              <Badge variant={d.status === 'VERIFIED' ? 'default' : d.status === 'REJECTED' ? 'destructive' : 'outline'}>
                {d.status}
              </Badge>
            </TableCell>
            <TableCell>{d.expiryDate ? formatDate(d.expiryDate) : '—'}</TableCell>
            <TableCell>{formatDate(d.uploadedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function LegalDocsTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <LegalDocsContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Blocks & Blacklist Tab
// ═══════════════════════════════════════════════════════════════════════════

async function BlocksContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierBlocks(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load blocks.</p>;
  const blocks = result.value.data;
  if (blocks.length === 0)
    return (
      <div className="py-8 text-center">
        <CheckCircle className="mx-auto h-8 w-8 text-success mb-2" />
        <p className="text-sm text-muted-foreground">No active blocks on this supplier.</p>
      </div>
    );
  return (
    <Table>
      <caption className="sr-only">Supplier blocks</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Block Type</TableHead>
          <TableHead>Scope</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Effective From</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {blocks.map((b) => (
          <TableRow key={b.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" />
                <Badge variant="destructive">{b.blockType}</Badge>
              </div>
            </TableCell>
            <TableCell><Badge variant="outline">{b.blockScope}</Badge></TableCell>
            <TableCell className="max-w-[300px] truncate">{b.reason}</TableCell>
            <TableCell>{formatDate(b.effectiveFrom)}</TableCell>
            <TableCell>
              {b.isActive ? (
                <Badge variant="destructive">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function BlocksTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <BlocksContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Risk Indicators Tab
// ═══════════════════════════════════════════════════════════════════════════

async function RiskContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierRiskIndicators(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load risk indicators.</p>;
  const risks = result.value.data;
  if (risks.length === 0)
    return (
      <div className="py-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-success mb-2" />
        <p className="text-sm text-muted-foreground">No active risk indicators.</p>
      </div>
    );
  return (
    <Table>
      <caption className="sr-only">Risk indicators</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {risks.map((r) => (
          <TableRow key={r.id}>
            <TableCell><Badge variant="outline">{r.riskCategory}</Badge></TableCell>
            <TableCell>
              <Badge
                variant={
                  r.riskRating === 'HIGH' || r.riskRating === 'CRITICAL' ? 'destructive'
                    : r.riskRating === 'MEDIUM' ? 'outline'
                      : 'secondary'
                }
              >
                {r.riskRating}
              </Badge>
            </TableCell>
            <TableCell className="max-w-[300px] truncate">{r.description}</TableCell>
            <TableCell>
              {r.isActive ? (
                <Badge variant="destructive">Active</Badge>
              ) : (
                <Badge variant="secondary">Resolved</Badge>
              )}
            </TableCell>
            <TableCell>{formatDate(r.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function RiskTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <RiskContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Evaluations Tab
// ═══════════════════════════════════════════════════════════════════════════

async function EvaluationsContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierEvaluations(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load evaluations.</p>;
  const evals = result.value.data;
  if (evals.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No evaluations recorded.</p>;
  return (
    <Table>
      <caption className="sr-only">Evaluations</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Template</TableHead>
          <TableHead>Evaluator</TableHead>
          <TableHead>Period</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Completed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {evals.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                {e.templateName}
              </div>
            </TableCell>
            <TableCell>{e.evaluatorName}</TableCell>
            <TableCell>{e.period}</TableCell>
            <TableCell>
              {e.overallScore !== null ? (
                <span className="font-mono font-medium">{e.overallScore}%</span>
              ) : '—'}
            </TableCell>
            <TableCell>
              <Badge variant={e.status === 'COMPLETED' ? 'default' : 'outline'}>{e.status}</Badge>
            </TableCell>
            <TableCell>{e.completedAt ? formatDate(e.completedAt) : '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function EvaluationsTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <EvaluationsContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Diversity Tab
// ═══════════════════════════════════════════════════════════════════════════

async function DiversityContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierDiversity(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load diversity certifications.</p>;
  const certs = result.value.data;
  if (certs.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No diversity certifications recorded.</p>;
  return (
    <Table>
      <caption className="sr-only">Diversity certifications</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Diversity Code</TableHead>
          <TableHead>Certification Body</TableHead>
          <TableHead>Cert #</TableHead>
          <TableHead>Valid From</TableHead>
          <TableHead>Valid To</TableHead>
          <TableHead>Verified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {certs.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{c.diversityCode}</Badge>
              </div>
            </TableCell>
            <TableCell>{c.certificationBody ?? '—'}</TableCell>
            <TableCell className="font-mono text-sm">{c.certificationNumber ?? '—'}</TableCell>
            <TableCell>{formatDate(c.validFrom)}</TableCell>
            <TableCell>{c.validTo ? formatDate(c.validTo) : '—'}</TableCell>
            <TableCell>
              {c.verified ? (
                <CheckCircle className="h-4 w-4 text-success" />
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function DiversityTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <DiversityContent supplierId={supplierId} />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Company Overrides Tab
// ═══════════════════════════════════════════════════════════════════════════

async function CompanyOverridesContent({ supplierId }: { supplierId: string }) {
  const ctx = await getRequestContext();
  const result = await getSupplierCompanyOverrides(ctx, supplierId);
  if (!result.ok) return <p className="py-8 text-center text-sm text-muted-foreground">Failed to load company overrides.</p>;
  const overrides = result.value.data;
  if (overrides.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">No company-specific overrides configured.</p>;
  return (
    <Table>
      <caption className="sr-only">Company-specific overrides</caption>
      <TableHeader>
        <TableRow>
          <TableHead>Company</TableHead>
          <TableHead>Payment Terms</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead>WHT Rate</TableHead>
          <TableHead>Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {overrides.map((o) => (
          <TableRow key={o.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{o.companyName}</span>
              </div>
            </TableCell>
            <TableCell>{o.paymentTermsOverride ?? '—'}</TableCell>
            <TableCell>{o.paymentMethodOverride ?? '—'}</TableCell>
            <TableCell>{o.currencyOverride ?? '—'}</TableCell>
            <TableCell>{o.whtRateOverride ?? '—'}</TableCell>
            <TableCell>{formatDate(o.updatedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
export function CompanyOverridesTab({ supplierId }: { supplierId: string }) {
  return (
    <Suspense fallback={<LoadingSkeleton variant="table" />}>
      <CompanyOverridesContent supplierId={supplierId} />
    </Suspense>
  );
}
