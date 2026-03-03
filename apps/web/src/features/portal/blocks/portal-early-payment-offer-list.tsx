'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Zap, CheckCircle2, Clock, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { routes } from '@/lib/constants';
import type {
  EarlyPaymentOffer,
  EarlyPaymentOfferStatus,
  EarlyPaymentOfferListResponse,
} from '../queries/portal.queries';

// ─── Config ──────────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  Icon: React.ElementType;
  badgeClass: string;
}

const STATUS_CONFIG: Record<EarlyPaymentOfferStatus, StatusConfig> = {
  PENDING: {
    label: 'Pending',
    Icon: Clock,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  ACCEPTED: {
    label: 'Accepted',
    Icon: CheckCircle2,
    badgeClass: 'bg-success/10 text-success border-success/30',
  },
  DECLINED: {
    label: 'Declined',
    Icon: XCircle,
    badgeClass: 'bg-muted text-muted-foreground border-border',
  },
  EXPIRED: {
    label: 'Expired',
    Icon: AlertCircle,
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatAmount(minor: string, currency: string): string {
  try {
    const value = Number(minor) / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${minor} ${currency}`;
  }
}

function formatRate(bps: number, type: 'APR' | 'FLAT'): string {
  const pct = (bps / 100).toFixed(2);
  return type === 'APR' ? `${pct}% APR` : `${pct}% flat`;
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function OfferRow({ offer }: { offer: EarlyPaymentOffer }) {
  const cfg = STATUS_CONFIG[offer.status];
  const Icon = cfg.Icon;
  const isPending = offer.status === 'PENDING';
  const [clientNow, setClientNow] = useState(0);
  useEffect(() => {
    setClientNow(Date.now());
  }, []);
  const isExpiringSoon =
    isPending &&
    clientNow > 0 &&
    new Date(offer.offerExpiresAt) < new Date(clientNow + 48 * 60 * 60 * 1000);

  return (
    <TableRow>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {offer.invoiceId.slice(0, 8)}…
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">
          {formatAmount(offer.netPaymentAmountMinor, offer.currency)}
        </div>
        <div className="text-xs text-muted-foreground">
          saves {formatAmount(offer.discountAmountMinor, offer.currency)} (
          {formatRate(offer.discountBps, offer.pricingType)})
        </div>
      </TableCell>
      <TableCell className="text-sm">{formatDate(offer.proposedPaymentDate)}</TableCell>
      <TableCell className="text-sm">{formatDate(offer.originalDueDate)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs',
              isExpiringSoon ? 'font-medium text-warning' : 'text-muted-foreground'
            )}
          >
            {formatDate(offer.offerExpiresAt)}
          </span>
          {isExpiringSoon && <AlertCircle className="h-3 w-3 text-warning" aria-hidden="true" />}
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('gap-1 text-xs', cfg.badgeClass)}>
          <Icon className="h-3 w-3" aria-hidden="true" />
          {cfg.label}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {isPending && (
          <Button asChild size="sm" variant="default" className="gap-1.5">
            <Link href={routes.portal.earlyPaymentDetail(offer.id)}>
              <Zap className="h-3.5 w-3.5" />
              Review Offer
            </Link>
          </Button>
        )}
        {offer.status === 'ACCEPTED' && (
          <span className="flex items-center justify-end gap-1 text-xs text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Accepted {offer.acceptedAt ? formatDate(offer.acceptedAt) : ''}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface PortalEarlyPaymentOfferListProps {
  data: EarlyPaymentOfferListResponse;
}

export function PortalEarlyPaymentOfferList({ data }: PortalEarlyPaymentOfferListProps) {
  const { items } = data;

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Zap className="h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold">No early payment offers</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When your AP team creates early payment offers for your invoices, they will appear here.
            Accepting an offer lets you receive payment ahead of the due date at a small discount.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending count callout */}
      {(() => {
        const pending = items.filter((i) => i.status === 'PENDING').length;
        if (pending === 0) return null;
        return (
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <Zap className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                {pending} early payment offer{pending !== 1 ? 's' : ''} awaiting your review
              </p>
              <p className="mt-0.5 text-xs text-blue-700">
                Accept to receive payment ahead of schedule at a small discount.
              </p>
            </div>
          </div>
        );
      })()}

      <div className="rounded-md border">
        <Table>
          <caption className="sr-only">Early payment offers</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Early Pay Date</TableHead>
              <TableHead>Original Due</TableHead>
              <TableHead>Offer Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((offer) => (
              <OfferRow key={offer.id} offer={offer} />
            ))}
          </TableBody>
        </Table>
      </div>

      {data.hasMore && (
        <p className="text-center text-xs text-muted-foreground">
          Showing {items.length} of {data.total} offers
        </p>
      )}
    </div>
  );
}
