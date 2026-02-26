/**
 * @see DA-09 — Table partitioning strategy for high-volume GL tables
 *
 * Pure calculator — no I/O, no side effects.
 * Computes the optimal partition scheme for gl_journal_line and gl_balance
 * based on data volume metrics and fiscal period boundaries.
 * Outputs DDL-ready partition definitions.
 */

export type PartitionMethod = 'RANGE' | 'LIST' | 'HASH';

export interface TableVolumeMetrics {
  readonly tableName: string;
  readonly estimatedRowCount: bigint;
  readonly avgRowSizeBytes: number;
  readonly oldestPeriod: string;
  readonly newestPeriod: string;
  readonly distinctPeriods: number;
  readonly partitionKeyColumn: string;
}

export interface PartitionBoundary {
  readonly partitionName: string;
  readonly fromValue: string;
  readonly toValue: string;
  readonly estimatedRows: bigint;
  readonly estimatedSizeMb: number;
}

export interface PartitionPlan {
  readonly tableName: string;
  readonly method: PartitionMethod;
  readonly partitionKeyColumn: string;
  readonly partitions: readonly PartitionBoundary[];
  readonly totalPartitions: number;
  readonly ddlStatements: readonly string[];
  readonly estimatedTotalSizeMb: number;
}

export interface PartitionStrategyReport {
  readonly plans: readonly PartitionPlan[];
  readonly recommendations: readonly string[];
}

const TARGET_PARTITION_SIZE_MB = 512;
const MIN_ROWS_FOR_PARTITIONING = 1_000_000n;

function estimateSizeMb(rowCount: bigint, avgRowSizeBytes: number): number {
  return Number((rowCount * BigInt(avgRowSizeBytes)) / (1024n * 1024n));
}

function generateFiscalPeriods(oldest: string, newest: string): string[] {
  const periods: string[] = [];
  const [startYear, startPeriod] = oldest.split('-P').map(Number);
  const [endYear, endPeriod] = newest.split('-P').map(Number);

  if (
    startYear === undefined ||
    startPeriod === undefined ||
    endYear === undefined ||
    endPeriod === undefined
  ) {
    return [oldest, newest];
  }

  let year = startYear;
  let period = startPeriod;

  while (year < endYear || (year === endYear && period <= endPeriod)) {
    periods.push(`${year}-P${String(period).padStart(2, '0')}`);
    period++;
    if (period > 12) {
      period = 1;
      year++;
    }
  }

  return periods;
}

export function computePartitionStrategy(tables: readonly TableVolumeMetrics[]): {
  result: PartitionStrategyReport;
  explanation: string;
} {
  if (tables.length === 0) {
    throw new Error('At least one table volume metric is required');
  }

  const plans: PartitionPlan[] = [];
  const recommendations: string[] = [];

  for (const table of tables) {
    if (table.estimatedRowCount < MIN_ROWS_FOR_PARTITIONING) {
      recommendations.push(
        `${table.tableName}: ${table.estimatedRowCount} rows — below ${MIN_ROWS_FOR_PARTITIONING} threshold, partitioning not recommended yet`
      );
      continue;
    }

    const totalSizeMb = estimateSizeMb(table.estimatedRowCount, table.avgRowSizeBytes);
    const periods = generateFiscalPeriods(table.oldestPeriod, table.newestPeriod);

    const rowsPerPeriod = table.estimatedRowCount / BigInt(Math.max(table.distinctPeriods, 1));
    const sizePerPeriod = estimateSizeMb(rowsPerPeriod, table.avgRowSizeBytes);

    let groupSize = 1;
    if (sizePerPeriod < TARGET_PARTITION_SIZE_MB / 4) {
      groupSize = Math.ceil(TARGET_PARTITION_SIZE_MB / Math.max(sizePerPeriod, 1));
      groupSize = Math.min(groupSize, 12);
    }

    const partitions: PartitionBoundary[] = [];
    const ddl: string[] = [];

    ddl.push(
      `-- Partition ${table.tableName} by ${table.partitionKeyColumn} (RANGE)`,
      `ALTER TABLE ${table.tableName} RENAME TO ${table.tableName}_old;`,
      `CREATE TABLE ${table.tableName} (LIKE ${table.tableName}_old INCLUDING ALL) PARTITION BY RANGE (${table.partitionKeyColumn});`
    );

    for (let i = 0; i < periods.length; i += groupSize) {
      const fromPeriod = periods[i]!;
      const toPeriod = periods[Math.min(i + groupSize, periods.length) - 1]!;
      const partName = `${table.tableName}_${fromPeriod.replace(/-/g, '_')}`;
      const estRows = rowsPerPeriod * BigInt(Math.min(groupSize, periods.length - i));
      const estSize = estimateSizeMb(estRows, table.avgRowSizeBytes);

      partitions.push({
        partitionName: partName,
        fromValue: fromPeriod,
        toValue: toPeriod,
        estimatedRows: estRows,
        estimatedSizeMb: estSize,
      });

      const nextPeriod = periods[Math.min(i + groupSize, periods.length)];
      const toVal = nextPeriod ?? 'MAXVALUE';
      ddl.push(
        `CREATE TABLE ${partName} PARTITION OF ${table.tableName} FOR VALUES FROM ('${fromPeriod}') TO (${toVal === 'MAXVALUE' ? 'MAXVALUE' : `'${toVal}'`});`
      );
    }

    ddl.push(
      `-- Migrate data`,
      `INSERT INTO ${table.tableName} SELECT * FROM ${table.tableName}_old;`,
      `DROP TABLE ${table.tableName}_old;`
    );

    plans.push({
      tableName: table.tableName,
      method: 'RANGE',
      partitionKeyColumn: table.partitionKeyColumn,
      partitions,
      totalPartitions: partitions.length,
      ddlStatements: ddl,
      estimatedTotalSizeMb: totalSizeMb,
    });

    recommendations.push(
      `${table.tableName}: ${partitions.length} partitions (${groupSize} period(s) each), ~${totalSizeMb} MB total`
    );
  }

  return {
    result: { plans, recommendations },
    explanation:
      plans.length === 0
        ? `${tables.length} table(s) analyzed — none qualify for partitioning`
        : `${plans.length}/${tables.length} table(s) partitioned: ${plans.map((p) => `${p.tableName} (${p.totalPartitions} partitions)`).join(', ')}`,
  };
}
