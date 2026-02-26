'use client';

import { FxRateTable } from './fx-rate-table';
import { FxRateEditDialog } from './fx-rate-edit-dialog';
import type { FxRateListItem } from '../queries/fx.queries';

interface FxRateListProps {
  data: FxRateListItem[];
}

export function FxRateList({ data }: FxRateListProps) {
  return <FxRateTable data={data} editAction={(rate) => <FxRateEditDialog rate={rate} />} />;
}
