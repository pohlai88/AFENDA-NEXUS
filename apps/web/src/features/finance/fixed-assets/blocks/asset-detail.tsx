'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { routes } from '@/lib/constants';
import { toast } from 'sonner';
import {
  Box,
  Calendar,
  MapPin,
  Building2,
  User,
  Barcode,
  FileText,
  CheckCircle,
  Clock,
  Trash2,
  Edit,
  ArrowLeft,
} from 'lucide-react';
import type { FixedAsset, DepreciationScheduleEntry, AssetStatus } from '../types';
import { assetStatusConfig, depreciationMethodLabels } from '../types';
import { createDisposalRequest } from '../actions/assets.actions';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AssetStatus }) {
  const config = assetStatusConfig[status];
  return <Badge className={config.color}>{config.label}</Badge>;
}

// ─── Asset Header ────────────────────────────────────────────────────────────

interface AssetHeaderProps {
  asset: FixedAsset;
}

function AssetHeader({ asset }: AssetHeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDispose = () => {
    startTransition(async () => {
      const result = await createDisposalRequest({
        assetId: asset.id,
        disposalType: 'sale',
        expectedProceeds: asset.netBookValue,
        reason: 'User initiated disposal',
      });

      if (result.ok) {
        toast.success(`Disposal request ${result.data.requestNumber} created`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={routes.finance.fixedAssets}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="rounded-lg bg-accent p-3">
          <Box className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <StatusBadge status={asset.status} />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-mono">{asset.assetNumber}</span>
            <span>•</span>
            <span>{asset.categoryName}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {asset.status === 'active' && (
          <>
            <Button variant="outline" asChild>
              <Link href={`${routes.finance.fixedAssets}/${asset.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={handleDispose} disabled={isPending}>
              <Trash2 className="mr-2 h-4 w-4" />
              Dispose
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Value Summary Card ──────────────────────────────────────────────────────

function ValueSummaryCard({ asset }: { asset: FixedAsset }) {
  const depreciableAmount = asset.originalCost - asset.salvageValue;
  const depreciationPercent =
    depreciableAmount > 0 ? (asset.accumulatedDepreciation / depreciableAmount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Value Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Original Cost</div>
            <div className="font-mono font-bold text-lg">
              {formatCurrency(asset.originalCost, asset.currency)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Salvage Value</div>
            <div className="font-mono">{formatCurrency(asset.salvageValue, asset.currency)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Accumulated Depreciation</div>
            <div className="font-mono text-destructive">
              ({formatCurrency(asset.accumulatedDepreciation, asset.currency)})
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Net Book Value</div>
            <div className="font-mono font-bold text-lg text-success">
              {formatCurrency(asset.netBookValue, asset.currency)}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Depreciation Progress</span>
            <span className="font-medium">{Math.round(depreciationPercent)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-accent">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(depreciationPercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Asset Details Card ──────────────────────────────────────────────────────

function AssetDetailsCard({ asset }: { asset: FixedAsset }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asset Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Acquisition Date:</dt>
            <dd>{formatDate(asset.acquisitionDate)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <dt className="text-muted-foreground">In Service Date:</dt>
            <dd>{formatDate(asset.inServiceDate)}</dd>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Location:</dt>
            <dd>{asset.location}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Department:</dt>
            <dd>{asset.department}</dd>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <dt className="text-muted-foreground">Responsible Person:</dt>
            <dd>{asset.responsiblePerson}</dd>
          </div>
          {asset.serialNumber && (
            <div className="flex items-center gap-2">
              <Barcode className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Serial Number:</dt>
              <dd className="font-mono">{asset.serialNumber}</dd>
            </div>
          )}
          {asset.vendorName && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Vendor:</dt>
              <dd>{asset.vendorName}</dd>
            </div>
          )}
          {asset.warrantyExpiryDate && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <dt className="text-muted-foreground">Warranty Expiry:</dt>
              <dd
                className={cn(
                  new Date(asset.warrantyExpiryDate) < new Date() && 'text-destructive'
                )}
              >
                {formatDate(asset.warrantyExpiryDate)}
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

// ─── Depreciation Method Card ────────────────────────────────────────────────

function DepreciationMethodCard({ asset }: { asset: FixedAsset }) {
  const years = Math.floor(asset.usefulLifeMonths / 12);
  const months = asset.usefulLifeMonths % 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Depreciation Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Method:</span>
          <Badge variant="outline">{depreciationMethodLabels[asset.depreciationMethod]}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Useful Life:</span>
          <span>
            {years > 0 && `${years} year${years !== 1 ? 's' : ''}`}
            {months > 0 && ` ${months} month${months !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Last Depreciation:</span>
          <span>
            {asset.lastDepreciationDate
              ? formatDate(asset.lastDepreciationDate)
              : 'Not yet depreciated'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Depreciation Schedule Tab ───────────────────────────────────────────────

function DepreciationScheduleTab({ schedule }: { schedule: DepreciationScheduleEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Depreciation Schedule</CardTitle>
        <CardDescription>Monthly depreciation entries</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <caption className="sr-only">Depreciation schedule</caption>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead className="text-right">Depreciation</TableHead>
              <TableHead className="text-right">Accumulated</TableHead>
              <TableHead className="text-right">Net Book Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.periodName}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(entry.depreciationAmount, 'USD')}
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  ({formatCurrency(entry.accumulatedDepreciation, 'USD')})
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(entry.netBookValue, 'USD')}
                </TableCell>
                <TableCell>
                  {entry.isPosted ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Posted
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ─── Main Asset Detail Component ─────────────────────────────────────────────

interface AssetDetailProps {
  asset: FixedAsset;
  schedule: DepreciationScheduleEntry[];
}

export function AssetDetail({ asset, schedule }: AssetDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <AssetHeader asset={asset} />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Depreciation Schedule</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="documents">Documents ({asset.attachmentCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-3">
            <ValueSummaryCard asset={asset} />
            <AssetDetailsCard asset={asset} />
            <DepreciationMethodCard asset={asset} />
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <DepreciationScheduleTab schedule={schedule} />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Asset History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Asset history will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Asset documents will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
