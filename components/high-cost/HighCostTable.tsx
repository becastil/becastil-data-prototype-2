'use client'

import { useMemo, useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  filterFns,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import type { HighCostClaimant } from '@/lib/schemas/highCost'

interface HighCostTableProps {
  claimants: HighCostClaimant[]
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export default function HighCostTable({ claimants }: HighCostTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'total', desc: true },
  ])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<HighCostClaimant>[]>(
    () => [
      {
        header: 'Member ID',
        accessorKey: 'memberId',
      },
      {
        header: 'Member Type',
        accessorKey: 'memberType',
      },
      {
        header: 'Age Band',
        accessorKey: 'ageBand',
      },
      {
        header: 'Primary Diagnosis Category',
        accessorKey: 'primaryDiagnosisCategory',
      },
      {
        header: 'Specific Diagnosis (Short)',
        accessorKey: 'specificDiagnosisShort',
      },
      {
        header: 'Specific Diagnosis Details',
        accessorKey: 'specificDiagnosis',
      },
      {
        header: '% of Plan Paid',
        accessorKey: 'percentPlanPaid',
        cell: info => `${info.getValue<number>().toFixed(1)}%`,
      },
      {
        header: '% of Large Claims',
        accessorKey: 'percentLargeClaims',
        cell: info => `${info.getValue<number>().toFixed(1)}%`,
      },
      {
        header: 'Total Cost',
        accessorKey: 'total',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Facility Inpatient',
        accessorKey: 'facilityInpatient',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Facility Outpatient',
        accessorKey: 'facilityOutpatient',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Professional',
        accessorKey: 'professional',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Pharmacy',
        accessorKey: 'pharmacy',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Top Provider',
        accessorKey: 'topProvider',
      },
      {
        header: 'Enrolled',
        accessorKey: 'enrolled',
      },
      {
        header: 'Stop-Loss Deductible',
        accessorKey: 'stopLossDeductible',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Estimated Stop-Loss Reimbursement',
        accessorKey: 'estimatedStopLossReimbursement',
        cell: info => currencyFormatter.format(info.getValue<number>()),
      },
      {
        header: 'Hit Stop Loss?',
        accessorKey: 'hitStopLoss',
      },
    ],
    [],
  )

  const table = useReactTable({
    data: claimants,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    filterFns: {
      includesString: filterFns.includesString,
    },
  })

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-[#2f2a24]">High-Cost Claimant Breakdown</h3>
        <input
          type="search"
          value={globalFilter ?? ''}
          onChange={event => setGlobalFilter(event.target.value)}
          placeholder="Search member, diagnosis, provider..."
          className="w-full max-w-xs rounded-md border border-[#eadfce] bg-white px-3 py-2 text-sm text-[#2f2a24] focus:border-[#cdbfa9] focus:outline-none focus:ring-2 focus:ring-[#cdbfa9]/60"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#eadfce] text-sm text-[#2f2a24]">
          <thead className="bg-[#f3ede2]">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="cursor-pointer px-3 py-2 text-left font-semibold text-[#3d382f]"
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && <span className="text-xs">▲</span>}
                        {sorted === 'desc' && <span className="text-xs">▼</span>}
                      </div>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[#f0e4d0] bg-white">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="transition-colors hover:!bg-[#f3ede2]">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-3 py-2 text-[#4f463b]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-[#9b9287]">
                  No matching claimants.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
