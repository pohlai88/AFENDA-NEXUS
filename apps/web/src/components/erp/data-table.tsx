'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/empty-state';
import { ExportMenu, type ExportPayload } from '@/components/erp/export-menu';
import { cn } from '@/lib/utils';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
} from 'lucide-react';

// ─── Column Definition ───────────────────────────────────────────────────────

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorFn: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: T, b: T) => number;
  className?: string;
  hidden?: boolean;
  pinned?: boolean;
}

/** Legacy column API (key/header/render) - converted to ColumnDef internally */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

function isColumnDef<T>(col: Column<T> | ColumnDef<T>): col is ColumnDef<T> {
  return 'id' in col && 'accessorFn' in col;
}

function toColumnDefs<T>(columns: Column<T>[]): ColumnDef<T>[] {
  return columns.map((col) => {
    const sortFn = col.sortable
      ? (a: T, b: T) => {
          const av = (a as Record<string, unknown>)[col.key];
          const bv = (b as Record<string, unknown>)[col.key];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === 'number' && typeof bv === 'number') return av - bv;
          return String(av).localeCompare(String(bv));
        }
      : undefined;
    const alignClass =
      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : undefined;
    return {
      id: col.key,
      header: col.header,
      accessorFn: col.render,
      sortable: col.sortable,
      sortFn,
      className: col.className ?? alignClass,
    };
  });
}

function normalizeColumns<T>(columns: (Column<T> | ColumnDef<T>)[]): ColumnDef<T>[] {
  if (columns.length === 0) return [];
  const first = columns[0]!;
  return isColumnDef(first) ? (columns as ColumnDef<T>[]) : toColumnDefs(columns as Column<T>[]);
}

// ─── Pagination Types ────────────────────────────────────────────────────────

export interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}

// ─── DataTable Props ─────────────────────────────────────────────────────────

export interface EmptyStateConfig {
  icon?: React.ElementType;
  title?: string;
  description?: string;
  action?: React.ReactNode | { label: string; href: string };
}

/** Legacy pagination (page/perPage/total/totalPages) - baseUrl derived from current path when missing */
export interface LegacyPaginationProps {
  page: number;
  perPage?: number;
  total: number;
  totalPages: number;
}

interface DataTableProps<T> {
  columns: (Column<T> | ColumnDef<T>)[];
  data: T[];
  keyFn?: (row: T) => string;
  /** Legacy: use this field as row key (e.g. "id") */
  keyField?: keyof T | string;

  // Search
  searchPlaceholder?: string;
  searchFn?: (row: T, query: string) => boolean;
  /** Legacy: build searchFn from these keys (searches string values) */
  searchKeys?: (keyof T | string)[];

  // Row interaction
  onRowClick?: (row: T) => void;

  // Empty state
  emptyMessage?: string;
  emptyTitle?: string;
  emptyIcon?: React.ElementType;
  emptyAction?: React.ReactNode;
  /** Legacy: maps to emptyTitle, emptyMessage, emptyIcon, emptyAction */
  emptyState?: EmptyStateConfig;

  // Toolbar
  actions?: React.ReactNode;

  /** Legacy: page size (for display; client-side pagination not yet implemented) */
  pageSize?: number;

  // Loading state
  loading?: boolean;
  loadingRows?: number;

  // Server pagination (URL-based)
  pagination?: PaginationProps | LegacyPaginationProps;

  // Bulk selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  bulkActions?: React.ReactNode;

  // Column toggles
  columnToggles?: boolean;

  // Search (legacy shorthand — enables client-side search across all string values)
  searchable?: boolean;

  // Export
  exportPayload?: ExportPayload;

  // Styling
  className?: string;
  compact?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

// ─── Helper: Build pagination URL ────────────────────────────────────────────

function buildPaginationUrl(
  baseUrl: string,
  page: number,
  searchParams?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && key !== 'page') {
        params.set(key, value);
      }
    });
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

// ─── Column Visibility Hook ──────────────────────────────────────────────────

function useColumnVisibility<T>(columns: ColumnDef<T>[], storageKey?: string) {
  const defaultVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = {};
    columns.forEach((col) => {
      visibility[col.id] = !col.hidden;
    });
    return visibility;
  }, [columns]);

  const [visibility, setVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined' || !storageKey) return defaultVisibility;
    try {
      const stored = localStorage.getItem(`dt-cols-${storageKey}`);
      return stored ? { ...defaultVisibility, ...JSON.parse(stored) } : defaultVisibility;
    } catch {
      return defaultVisibility;
    }
  });

  const toggleColumn = useCallback(
    (columnId: string) => {
      setVisibility((prev) => {
        const next = { ...prev, [columnId]: !prev[columnId] };
        if (storageKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`dt-cols-${storageKey}`, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [storageKey]
  );

  const visibleColumns = useMemo(
    () => columns.filter((col) => visibility[col.id] !== false),
    [columns, visibility]
  );

  return { visibility, toggleColumn, visibleColumns, allColumns: columns };
}

// ─── Skeleton Rows Component ─────────────────────────────────────────────────

function SkeletonRows({
  columnCount,
  rowCount,
  selectable,
}: {
  columnCount: number;
  rowCount: number;
  selectable?: boolean;
}) {
  const totalColumns = selectable ? columnCount + 1 : columnCount;

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {selectable && (
            <TableCell className="w-12">
              <Skeleton className="h-4 w-4" />
            </TableCell>
          )}
          {Array.from({ length: columnCount }).map((_, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton className="h-4 w-full max-w-[200px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Pagination Component ────────────────────────────────────────────────────

function Pagination({ page, totalPages, baseUrl, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between border-t px-2 py-3">
      <div className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrev}
          asChild={canGoPrev}
        >
          {canGoPrev ? (
            <Link href={buildPaginationUrl(baseUrl, 1, searchParams)} aria-label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-label="First page">
              <ChevronsLeft className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoPrev}
          asChild={canGoPrev}
        >
          {canGoPrev ? (
            <Link
              href={buildPaginationUrl(baseUrl, page - 1, searchParams)}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext}
          asChild={canGoNext}
        >
          {canGoNext ? (
            <Link href={buildPaginationUrl(baseUrl, page + 1, searchParams)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={!canGoNext}
          asChild={canGoNext}
        >
          {canGoNext ? (
            <Link
              href={buildPaginationUrl(baseUrl, totalPages, searchParams)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Link>
          ) : (
            <span aria-label="Last page">
              <ChevronsRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main DataTable Component ────────────────────────────────────────────────

function isLegacyPagination(
  p: PaginationProps | LegacyPaginationProps | undefined
): p is LegacyPaginationProps {
  return p != null && !('baseUrl' in p);
}

export function DataTable<T>({
  columns: rawColumns,
  data,
  keyFn: keyFnProp,
  keyField,
  searchPlaceholder = 'Search...',
  searchFn: searchFnProp,
  searchKeys,
  onRowClick,
  emptyMessage: emptyMessageProp,
  emptyTitle: emptyTitleProp,
  emptyIcon: emptyIconProp,
  emptyAction: emptyActionProp,
  emptyState,
  actions,
  loading = false,
  loadingRows = 5,
  pagination,
  selectable = false,
  selectedIds,
  onSelectionChange,
  bulkActions,
  columnToggles = false,
  searchable = false,
  exportPayload,
  className,
  compact = false,
}: DataTableProps<T>) {
  const pathname = usePathname();
  const columns = useMemo(() => normalizeColumns(rawColumns), [rawColumns]);
  const keyFn =
    keyFnProp ??
    (keyField
      ? (row: T) => String((row as Record<string, unknown>)[keyField as string] ?? '')
      : (row: T) => String((row as { id?: string }).id ?? ''));

  const paginationProps: PaginationProps | undefined = useMemo(() => {
    if (!pagination) return undefined;
    if (isLegacyPagination(pagination)) {
      return {
        page: pagination.page,
        totalPages: pagination.totalPages,
        baseUrl: pathname,
      };
    }
    return pagination;
  }, [pagination, pathname]);
  const searchFn = useMemo(() => {
    if (searchFnProp) return searchFnProp;
    if (searchKeys && searchKeys.length > 0) {
      const keys = searchKeys as string[];
      return (row: T, query: string) => {
        const q = query.toLowerCase();
        return keys.some((k) => {
          const val = (row as Record<string, unknown>)[k];
          return val != null && String(val).toLowerCase().includes(q);
        });
      };
    }
    if (searchable) {
      return (row: T, query: string) => {
        const q = query.toLowerCase();
        return Object.values(row as Record<string, unknown>).some(
          (val) => val != null && typeof val !== 'object' && String(val).toLowerCase().includes(q)
        );
      };
    }
    return undefined;
  }, [searchFnProp, searchKeys, searchable]);

  const emptyTitle = emptyTitleProp ?? emptyState?.title ?? 'No data';
  const emptyMessage = emptyMessageProp ?? emptyState?.description ?? 'No results found.';
  const emptyIcon = emptyIconProp ?? emptyState?.icon ?? Inbox;
  const emptyAction: React.ReactNode =
    emptyActionProp ??
    (emptyState?.action && typeof emptyState.action === 'object' && 'href' in emptyState.action
      ? (() => {
          const a = emptyState!.action as { label: string; href: string };
          return (
            <Button asChild>
              <Link href={a.href}>{a.label}</Link>
            </Button>
          );
        })()
      : (emptyState?.action as React.ReactNode | undefined));

  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(new Set());

  const effectiveSelectedIds = selectedIds ?? localSelectedIds;
  const effectiveOnSelectionChange = onSelectionChange ?? setLocalSelectedIds;

  const { visibility, toggleColumn, visibleColumns, allColumns } = useColumnVisibility(
    columns,
    columnToggles ? 'datatable' : undefined
  );

  // Client-side filtering (when searchFn is provided)
  const filteredData = useMemo(() => {
    if (!search || !searchFn) return data;
    return data.filter((row) => searchFn(row, search));
  }, [data, search, searchFn]);

  // Client-side sorting
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col?.sortFn) return filteredData;
    const sorted = [...filteredData].sort(col.sortFn);
    return sortDirection === 'desc' ? sorted.reverse() : sorted;
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Sorting handlers
  function handleSort(columnId: string) {
    if (sortColumn === columnId) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  }

  function getSortAriaSort(columnId: string): 'ascending' | 'descending' | 'none' {
    if (sortColumn !== columnId) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  function SortIcon({ columnId }: { columnId: string }) {
    if (sortColumn !== columnId) return <ArrowUpDown className="ml-1 h-3 w-3" />;
    if (sortDirection === 'asc') return <ArrowUp className="ml-1 h-3 w-3" />;
    return <ArrowDown className="ml-1 h-3 w-3" />;
  }

  // Selection handlers
  const allRowIds = useMemo(() => new Set(sortedData.map(keyFn)), [sortedData, keyFn]);
  const allSelected =
    allRowIds.size > 0 && [...allRowIds].every((id) => effectiveSelectedIds.has(id));
  const someSelected = [...allRowIds].some((id) => effectiveSelectedIds.has(id));
  const selectionCount = effectiveSelectedIds.size;

  function handleSelectAll() {
    if (allSelected) {
      effectiveOnSelectionChange(new Set());
    } else {
      effectiveOnSelectionChange(new Set(allRowIds));
    }
  }

  function handleSelectRow(id: string) {
    const next = new Set(effectiveSelectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    effectiveOnSelectionChange(next);
  }

  // Determine column count for accessibility
  const columnCount = visibleColumns.length + (selectable ? 1 : 0);
  const rowCount = sortedData.length;

  const showToolbar =
    searchFn || columnToggles || exportPayload || actions || (selectable && selectionCount > 0);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchFn && (
              <div className="relative max-w-sm flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 sm:w-64"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}

            {/* Bulk selection indicator */}
            {selectable && selectionCount > 0 && (
              <span className="text-sm text-muted-foreground">{selectionCount} selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Page actions */}
            {actions}

            {/* Bulk actions */}
            {selectable && selectionCount > 0 && bulkActions}

            {/* Column toggles */}
            {columnToggles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allColumns.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={visibility[col.id] !== false}
                      onCheckedChange={() => toggleColumn(col.id)}
                    >
                      {col.header}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Export */}
            {exportPayload && <ExportMenu payload={exportPayload} />}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table
          role="grid"
          aria-rowcount={rowCount}
          aria-colcount={columnCount}
          aria-label="Data table"
        >
          <TableHeader>
            <TableRow>
              {/* Selection checkbox header */}
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
              )}

              {/* Column headers */}
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(col.className, col.pinned && 'sticky left-0 bg-background')}
                  aria-sort={col.sortable ? getSortAriaSort(col.id) : undefined}
                >
                  {col.sortable ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort(col.id)}
                      aria-label={`Sort by ${col.header}`}
                    >
                      {col.header}
                      <SortIcon columnId={col.id} />
                    </Button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading state */}
            {loading ? (
              <SkeletonRows
                columnCount={visibleColumns.length}
                rowCount={loadingRows}
                selectable={selectable}
              />
            ) : sortedData.length === 0 ? (
              /* Empty state */
              <TableRow>
                <TableCell colSpan={columnCount} className="h-48">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyMessage}
                    icon={emptyIcon}
                    action={emptyAction}
                  />
                </TableCell>
              </TableRow>
            ) : (
              /* Data rows */
              sortedData.map((row) => {
                const rowId = keyFn(row);
                const isSelected = effectiveSelectedIds.has(rowId);

                return (
                  <TableRow
                    key={rowId}
                    className={cn(onRowClick && 'cursor-pointer', isSelected && 'bg-muted/50')}
                    onClick={() => onRowClick?.(row)}
                    aria-selected={selectable ? isSelected : undefined}
                    data-state={isSelected ? 'selected' : undefined}
                  >
                    {/* Selection checkbox */}
                    {selectable && (
                      <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                        />
                      </TableCell>
                    )}

                    {/* Data cells */}
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          col.className,
                          col.pinned && 'sticky left-0 bg-background',
                          compact && 'py-1.5'
                        )}
                      >
                        {col.accessorFn(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {paginationProps && !loading && <Pagination {...paginationProps} />}
    </div>
  );
}
