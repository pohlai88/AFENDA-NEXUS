import { MoneyCell } from '@/components/erp/money-cell';
import { cn } from '@/lib/utils';
import { layoutTokens } from '@/lib/layout-tokens';
import type { ReportSection } from '../queries/report.queries';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ─── Reusable report section table (used by balance-sheet + income-statement) ─

export function ReportSectionTable({ section }: { section: ReportSection }) {
  return (
    <div className="rounded-md border">
      <Table>
        <caption className="sr-only">{section.label} section</caption>
        <TableHeader>
          <TableRow>
            <TableHead className={layoutTokens.colAccount}>Code</TableHead>
            <TableHead>{section.label}</TableHead>
            <TableHead className={cn(layoutTokens.colReference, 'text-right')}>Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {section.rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                No accounts in this section.
              </TableCell>
            </TableRow>
          ) : (
            section.rows.map((row) => (
              <TableRow key={row.accountCode}>
                <TableCell className="font-mono text-xs">{row.accountCode}</TableCell>
                <TableCell>{row.accountName}</TableCell>
                <TableCell className="text-right">
                  <MoneyCell amount={row.balance} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={2}>Total {section.label}</TableCell>
            <TableCell className="text-right">
              <MoneyCell amount={section.total} />
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
