import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import SearchInput from './SearchInput'
import LoadingState from './LoadingState'
import EmptyState from './EmptyState'

export default function DataTable({
  columns = [],
  data = [],
  searchable = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  loading = false,
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription = 'There are no records to display.',
  pagination = true,
  serverPagination = null,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
}) {
  const [localPage, setLocalPage] = useState(1)
  const [localRowsPerPage, setLocalRowsPerPage] = useState(10)

  const safeData = Array.isArray(data) ? data : []
  const isServerPaged = Boolean(serverPagination)

  const rowsPerPage = isServerPaged
    ? serverPagination.limit || 10
    : localRowsPerPage
  const totalItems = isServerPaged
    ? serverPagination.totalItems ?? serverPagination.total ?? safeData.length
    : safeData.length
  const totalPages = isServerPaged
    ? Math.max(1, serverPagination.totalPages || 1)
    : Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const safePage = isServerPaged
    ? Math.min(Math.max(1, serverPagination.page || 1), totalPages)
    : Math.min(localPage, totalPages)

  const startIndex = pagination ? (safePage - 1) * rowsPerPage : 0
  const endIndex = isServerPaged
    ? Math.min(startIndex + safeData.length, totalItems)
    : pagination
      ? Math.min(startIndex + rowsPerPage, totalItems)
      : totalItems

  const displayedData = isServerPaged
    ? safeData
    : pagination
      ? safeData.slice(startIndex, endIndex)
      : safeData

  const handleRowsPerPageChange = (event) => {
    const nextLimit = Number(event.target.value)
    if (isServerPaged) {
      onRowsPerPageChange?.(nextLimit)
    } else {
      setLocalRowsPerPage(nextLimit)
      setLocalPage(1)
    }
  }

  const handlePageChange = (nextPage) => {
    const clamped = Math.min(Math.max(1, nextPage), totalPages)
    if (isServerPaged) {
      onPageChange?.(clamped)
    } else {
      setLocalPage(clamped)
    }
  }

  const handleSearchChange = (event) => {
    if (!isServerPaged) {
      setLocalPage(1)
    }
    if (onSearchChange) {
      const nextValue =
        typeof event === 'string' ? event : event?.target?.value ?? ''
      onSearchChange(nextValue)
    }
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="max-w-sm">
          <SearchInput
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {loading ? (
          <LoadingState />
        ) : totalItems === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="border-b border-border">
                  <tr>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider text-left whitespace-nowrap"
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedData.map((row, rowIndex) => (
                    <tr
                      key={row.id ?? row._id ?? startIndex + rowIndex}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={`border-b border-border last:border-0 hover:bg-surface/60 transition-colors duration-150 ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                    >
                      {columns.map((column) => {
                        const value = row[column.key]
                        return (
                          <td
                            key={column.key}
                            className="px-4 py-3.5 text-text-primary whitespace-nowrap"
                          >
                            {column.render ? column.render(value, row) : value}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-t border-border bg-card text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <select
                    aria-label="Rows per page"
                    value={rowsPerPage}
                    onChange={handleRowsPerPageChange}
                    className="rounded-md border border-border bg-white px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-150"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <span>
                    {startIndex + 1}-{endIndex} of {totalItems}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage - 1)}
                      disabled={safePage <= 1}
                      aria-label="Previous page"
                      className="p-1.5 rounded-md border border-border bg-white text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(safePage + 1)}
                      disabled={safePage >= totalPages}
                      aria-label="Next page"
                      className="p-1.5 rounded-md border border-border bg-white text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
