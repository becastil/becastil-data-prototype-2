'use client';

/**
 * Main ClaimsTable component with TanStack Table integration
 * Features: sticky headers, expand/collapse, sorting, filtering, virtualization
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  ProcessedData, 
  TableRow, 
  MonthKey, 
  SectionName,
  SECTION_GROUPS,
  getSectionForRow,
  MISSING_VALUE_DISPLAY,
  VIRTUALIZATION_THRESHOLD
} from '../lib/schema';

interface ClaimsTableProps {
  data: ProcessedData;
  visibleMonths: MonthKey[];
  onExport?: (format: 'csv' | 'xlsx') => void;
  className?: string;
}

interface TableData extends TableRow {
  sectionHeader?: boolean;
  isExpanded?: boolean;
}

const columnHelper = createColumnHelper<TableData>();

export function ClaimsTable({ 
  data, 
  visibleMonths, 
  onExport, 
  className = '' 
}: ClaimsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<SectionName>>(
    new Set(Object.keys(SECTION_GROUPS) as SectionName[])
  );
  const [showVirtualization, setShowVirtualization] = useState(true);

  // Transform data into table rows
  const tableData = useMemo(() => {
    const rows: TableData[] = [];
    
    Object.entries(SECTION_GROUPS).forEach(([sectionName, sectionRows]) => {
      const section = sectionName as SectionName;
      const isExpanded = expandedSections.has(section);
      
      // Add section header row
      rows.push({
        id: `section-${section}`,
        rowLabel: sectionRows[0], // Use first row as fallback
        section,
        values: new Map(),
        isVisible: true,
        sectionHeader: true,
        isExpanded
      });
      
      // Add data rows if section is expanded
      if (isExpanded) {
        sectionRows.forEach(rowLabel => {
          const rowData = data.data.get(rowLabel) || new Map();
          rows.push({
            id: `row-${rowLabel}`,
            rowLabel,
            section,
            values: rowData,
            isVisible: true,
            sectionHeader: false
          });
        });
      }
    });
    
    return rows;
  }, [data, expandedSections]);

  // Toggle section expansion
  const toggleSection = useCallback((section: SectionName) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);

  // Format currency values
  const formatValue = useCallback((value: number | null): string => {
    if (value === null || value === undefined) {
      return MISSING_VALUE_DISPLAY;
    }
    
    // Format as currency without decimals for large amounts
    if (Math.abs(value) >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }, []);

  // Create table columns
  const columns = useMemo(() => {
    const cols = [
      columnHelper.accessor('rowLabel', {
        id: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const data = row.original;
          
          if (data.sectionHeader) {
            return (
              <button
                onClick={() => toggleSection(data.section)}
                className="flex items-center gap-2 font-semibold text-left w-full p-2 hover:bg-gray-50"
                aria-expanded={data.isExpanded}
              >
                <span className="text-gray-400">
                  {data.isExpanded ? '▼' : '▶'}
                </span>
                {data.section}
              </button>
            );
          }
          
          return (
            <div className="pl-6 py-2 text-sm">
              {data.rowLabel}
            </div>
          );
        },
        enableSorting: false,
        size: 300,
      }),
    ];

    // Add month columns
    visibleMonths.forEach(month => {
      cols.push(
        columnHelper.accessor(
          (row) => row.values.get(month),
          {
            id: month,
            header: month,
            cell: ({ getValue, row }) => {
              if (row.original.sectionHeader) {
                return '';
              }
              
              const value = getValue();
              return (
                <div className="text-right tabular-nums py-2">
                  {formatValue(value)}
                </div>
              );
            },
            sortingFn: (rowA, rowB, columnId) => {
              const a = rowA.original.values.get(columnId) ?? -Infinity;
              const b = rowB.original.values.get(columnId) ?? -Infinity;
              return a - b;
            },
            size: 120,
          }
        )
      );
    });

    return cols;
  }, [visibleMonths, formatValue, toggleSection]);

  // Create table instance
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const rowData = row.original;
      if (rowData.sectionHeader) return true;
      return rowData.rowLabel.toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  const { rows } = table.getRowModel();
  const shouldVirtualize = showVirtualization && rows.length > VIRTUALIZATION_THRESHOLD;

  // Virtualization setup
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    enabled: shouldVirtualize,
  });

  const virtualItems = shouldVirtualize ? virtualizer.getVirtualItems() : null;

  return (
    <div className={`bg-white border border-gray-200 ${className}`}>
      {/* Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">
              Search categories
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search categories..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {shouldVirtualize && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium">
                  Virtualized
                </span>
                <button
                  onClick={() => setShowVirtualization(false)}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Disable
                </button>
              </div>
            )}
            
            {!shouldVirtualize && rows.length > VIRTUALIZATION_THRESHOLD && (
              <button
                onClick={() => setShowVirtualization(true)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Enable virtualization
              </button>
            )}
            
            {onExport && (
              <div className="flex gap-2">
                <button
                  onClick={() => onExport('csv')}
                  className="px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => onExport('xlsx')}
                  className="px-3 py-2 text-sm bg-green-600 text-white hover:bg-green-700"
                >
                  Export Excel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={parentRef}
        className="overflow-auto max-h-[80vh]"
        style={{ contain: 'strict' }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, index) => (
                  <th
                    key={header.id}
                    className={`
                      px-4 py-3 text-left font-semibold text-gray-900 border-r border-gray-200
                      ${index === 0 ? 'sticky left-0 bg-white z-20' : ''}
                    `}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`
                          ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          flex items-center gap-2
                        `}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-gray-400">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '↕'}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          
          <tbody>
            {shouldVirtualize ? (
              <>
                {virtualItems?.map((virtualItem) => {
                  const row = rows[virtualItem.index];
                  return (
                    <tr
                      key={row.id}
                      data-index={virtualItem.index}
                      ref={(node) => virtualizer.measureElement(node)}
                      className={`
                        border-b border-gray-100
                        ${row.original.sectionHeader ? 'bg-gray-50' : 'hover:bg-gray-50'}
                      `}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td
                          key={cell.id}
                          className={`
                            border-r border-gray-100
                            ${cellIndex === 0 ? 'sticky left-0 bg-white' : ''}
                            ${row.original.sectionHeader ? 'bg-gray-50' : ''}
                          `}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className={`
                    border-b border-gray-100
                    ${row.original.sectionHeader ? 'bg-gray-50' : 'hover:bg-gray-50'}
                  `}
                >
                  {row.getVisibleCells().map((cell, cellIndex) => (
                    <td
                      key={cell.id}
                      className={`
                        border-r border-gray-100
                        ${cellIndex === 0 ? 'sticky left-0 bg-white' : ''}
                        ${row.original.sectionHeader ? 'bg-gray-50' : ''}
                      `}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>
            Showing {rows.filter(r => !r.original.sectionHeader).length} data rows 
            across {visibleMonths.length} months
          </span>
          {shouldVirtualize && (
            <span className="text-xs">
              Virtualized for performance ({rows.length.toLocaleString()} total rows)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}