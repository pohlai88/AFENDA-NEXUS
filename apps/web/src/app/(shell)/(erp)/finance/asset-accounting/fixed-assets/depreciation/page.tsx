import { PageHeader, PageHeaderHeading, PageHeaderDescription } from '@/components/erp/page-header';
import { DepreciationRunWizard } from '@/features/finance/fixed-assets/blocks/depreciation-run-wizard';

export const metadata = {
  title: 'Run Depreciation | Fixed Assets | Afenda',
  description: 'Calculate and post asset depreciation',
};

export default function DepreciationRunPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeaderHeading>Run Depreciation</PageHeaderHeading>
        <PageHeaderDescription>
          Calculate depreciation for all active assets and post to the general ledger.
        </PageHeaderDescription>
      </PageHeader>

      <DepreciationRunWizard />
    </div>
  );
}
