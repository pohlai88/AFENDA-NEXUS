'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';
import {
  ExternalLink,
  ChevronRight,
  FileText,
  BookOpen,
  Receipt,
  HandCoins,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// DrilldownRow — clickable table row that navigates to the journal/document
// ═══════════════════════════════════════════════════════════════════════════

interface DrilldownRowProps extends Omit<React.HTMLAttributes<HTMLTableRowElement>, 'onClick'> {
  /** Journal ID to navigate to on click */
  journalId?: string;
  /** Source document ID (AP invoice, AR invoice, etc.) */
  documentId?: string;
  /** Document type for determining the link target */
  documentType?: 'ap-invoice' | 'ar-invoice' | 'journal' | 'expense-claim' | 'payment-run';
  /** Custom href override (takes precedence over journalId/documentId) */
  href?: string;
  /** Children (table cells) */
  children: React.ReactNode;
}

function resolveHref({ href, journalId, documentId, documentType }: DrilldownRowProps): string | undefined {
  if (href) return href;
  if (journalId) return routes.finance.journalDetail(journalId);
  if (documentId && documentType) {
    switch (documentType) {
      case 'ap-invoice':
        return routes.finance.payableDetail(documentId);
      case 'ar-invoice':
        return routes.finance.receivableDetail(documentId);
      case 'journal':
        return routes.finance.journalDetail(documentId);
      case 'expense-claim':
        return routes.finance.expenseDetail(documentId);
      case 'payment-run':
        return routes.finance.paymentRunDetail(documentId);
    }
  }
  return undefined;
}

export function DrilldownRow({ journalId, documentId, documentType, href, children, className, ...rest }: DrilldownRowProps) {
  const router = useRouter();
  const resolved = resolveHref({ journalId, documentId, documentType, href, children });

  return (
    <TableRow
      className={cn(
        resolved && 'cursor-pointer hover:bg-muted/50 transition-colors',
        className,
      )}
      onClick={resolved ? () => router.push(resolved) : undefined}
      {...rest}
    >
      {children}
    </TableRow>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DrilldownLink — inline clickable reference linking to a journal/document
// ═══════════════════════════════════════════════════════════════════════════

interface DrilldownLinkProps {
  /** The reference number or code to display */
  label: string;
  /** Journal ID */
  journalId?: string;
  /** Source document ID */
  documentId?: string;
  /** Document type */
  documentType?: 'ap-invoice' | 'ar-invoice' | 'journal' | 'expense-claim' | 'payment-run';
  /** Custom href */
  href?: string;
  /** Show external link icon */
  showIcon?: boolean;
  className?: string;
}

export function DrilldownLink({
  label,
  journalId,
  documentId,
  documentType,
  href,
  showIcon = true,
  className,
}: DrilldownLinkProps) {
  const resolved = resolveHref({
    journalId,
    documentId,
    documentType,
    href,
    children: null,
  });

  if (!resolved) {
    return <span className={cn('font-mono text-sm', className)}>{label}</span>;
  }

  return (
    <Link
      href={resolved}
      className={cn(
        'inline-flex items-center gap-1 font-mono text-sm text-primary hover:underline',
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
      { showIcon ? <ExternalLink className="h-3 w-3" /> : null}
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DrilldownBreadcrumb — shows the document chain breadcrumb
// ═══════════════════════════════════════════════════════════════════════════

interface DrilldownBreadcrumbItem {
  label: string;
  href?: string;
  icon?: 'journal' | 'ap-invoice' | 'ar-invoice' | 'receipt' | 'document';
}

interface DrilldownBreadcrumbProps {
  items: DrilldownBreadcrumbItem[];
  className?: string;
}

const iconMap: Record<string, typeof FileText> = {
  journal: BookOpen,
  'ap-invoice': Receipt,
  'ar-invoice': HandCoins,
  'expense-claim': Receipt,
  'payment-run': HandCoins,
  receipt: Receipt,
  document: FileText,
};

export function DrilldownBreadcrumb({ items, className }: DrilldownBreadcrumbProps) {
  return (
    <nav
      className={cn('flex items-center gap-1 text-xs text-muted-foreground', className)}
      aria-label="Document trail"
    >
      {items.map((item, index) => {
        const Icon = (item.icon ? iconMap[item.icon] : undefined) ?? FileText;
        return (
          // eslint-disable-next-line react/no-array-index-key
          <span key={`breadcrumb-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3" />}
            {item.href ? (
              <Link
                href={item.href}
                className="inline-flex items-center gap-1 hover:text-foreground hover:underline transition-colors"
              >
                <Icon className="h-3 w-3" />
                {item.label}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DocumentTypeIcon — small icon indicating document type in table cells
// ═══════════════════════════════════════════════════════════════════════════

export function DocumentTypeIcon({ type, className }: { type: DrilldownLinkProps['documentType']; className?: string }) {
  const Icon = type ? iconMap[type] ?? FileText : FileText;
  return <Icon className={cn('h-4 w-4 text-muted-foreground', className)} />;
}
