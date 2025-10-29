'use client'

import { cn } from '@/lib/utils'
import { ReactNode, useState, useMemo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Button } from './button'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Card, CardContent } from './card'
import { ChevronUp, ChevronDown, Search, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu'

interface ResponsiveTableColumn<T> {
  key: keyof T | string
  title: string
  render?: (value: unknown, row: T, index: number) => ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  responsive?: boolean
  priority?: number
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: ResponsiveTableColumn<T>[]
  className?: string
  loading?: boolean
  emptyMessage?: string
  searchable?: boolean
  searchPlaceholder?: string
  sortable?: boolean
  filterable?: boolean
  pagination?: boolean
  pageSize?: number
  pageSizeOptions?: number[]
  onRowClick?: (row: T, index: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onFilter?: (filters: Record<string, unknown>) => void
  actions?: (row: T, index: number) => ReactNode
  mobileView?: 'card' | 'list' | 'table'
  breakpoint?: 'sm' | 'md' | 'lg'
}

type SortDirection = 'asc' | 'desc' | null

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  className,
  loading = false,
  emptyMessage = 'No data available',
  searchable = true,
  searchPlaceholder = 'Search...',
  sortable = true,
  filterable = true,
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onRowClick,
  onSort,
  onFilter,
  actions,
  mobileView = 'card',
  breakpoint = 'md'
}: ResponsiveTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSizeState, setPageSizeState] = useState(pageSize)
  const [filters, setFilters] = useState<Record<string, any>>({})

  // Filter data based on search term and filters
  const filteredData = useMemo(() => {
    let result = data

    // Apply search filter
    if (searchTerm) {
      result = result.filter(row =>
        columns.some(column => {
          const value = getNestedValue(row, column.key)
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        result = result.filter(row => {
          const rowValue = getNestedValue(row, key)
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    return result
  }, [data, searchTerm, filters, columns])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortKey)
      const bValue = getNestedValue(b, sortKey)

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortDirection])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSizeState
    const endIndex = startIndex + pageSizeState
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, currentPage, pageSizeState, pagination])

  const totalPages = Math.ceil(filteredData.length / pageSizeState)

  const handleSort = (key: string) => {
    if (!sortable) return

    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortKey(key)
    setSortDirection(newDirection)
    onSort?.(key, newDirection)
  }

  const handleFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilter?.(newFilters)
  }

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const getVisibleColumns = () => {
    return columns
      .filter(column => column.responsive !== false)
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
  }

  const renderCell = (column: ResponsiveTableColumn<T>, row: T, index: number) => {
    const value = getNestedValue(row, column.key)
    
    if (column.render) {
      return column.render(value, row, index)
    }
    
    return <span>{value}</span>
  }

  const renderMobileCard = (row: T, index: number) => {
    const visibleColumns = getVisibleColumns().slice(0, 3) // Show only first 3 columns on mobile

    return (
      <Card key={index} className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-2">
            {visibleColumns.map((column) => (
              <div key={String(column.key)} className="flex justify-between">
                <span className="font-medium text-muted-foreground">{column.title}:</span>
                <span className="text-right">{renderCell(column, row, index)}</span>
              </div>
            ))}
            {actions && (
              <div className="pt-2 border-t">
                {actions(row, index)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderMobileList = (row: T, index: number) => {
    const visibleColumns = getVisibleColumns().slice(0, 2) // Show only first 2 columns on mobile

    return (
      <div key={index} className="border-b border-border py-3">
        <div className="space-y-1">
          {visibleColumns.map((column) => (
            <div key={String(column.key)} className="flex justify-between text-sm">
              <span className="font-medium text-muted-foreground">{column.title}:</span>
              <span className="text-right">{renderCell(column, row, index)}</span>
            </div>
          ))}
          {actions && (
            <div className="pt-2">
              {actions(row, index)}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="mb-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}
            {filterable && (
              <div className="flex gap-2">
                {columns
                  .filter(col => col.filterable)
                  .map((column) => (
                    <Select
                      key={String(column.key)}
                      value={filters[String(column.key)] || ''}
                      onValueChange={(value) => handleFilter(String(column.key), value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder={column.title} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All</SelectItem>
                        {Array.from(new Set(data.map(row => getNestedValue(row, column.key))))
                          .map((value) => (
                            <SelectItem key={String(value)} value={String(value)}>
                              {String(value)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile View */}
      <div className={`${breakpoint}:hidden`}>
        {mobileView === 'card' && (
          <div className="space-y-4">
            {paginatedData.map((row, index) => renderMobileCard(row, index))}
          </div>
        )}
        {mobileView === 'list' && (
          <div className="space-y-0">
            {paginatedData.map((row, index) => renderMobileList(row, index))}
          </div>
        )}
        {mobileView === 'table' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {getVisibleColumns().map((column) => (
                    <TableHead key={String(column.key)} className="whitespace-nowrap">
                      {column.title}
                    </TableHead>
                  ))}
                  {actions && <TableHead className="w-12"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {getVisibleColumns().map((column) => (
                      <TableCell key={String(column.key)} className="whitespace-nowrap">
                        {renderCell(column, row, index)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {actions(row, index)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className={`hidden ${breakpoint}:block`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {getVisibleColumns().map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn(
                      'whitespace-nowrap',
                      column.sortable && 'cursor-pointer hover:bg-muted/50',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                    onClick={() => column.sortable && handleSort(String(column.key))}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              'h-3 w-3',
                              sortKey === column.key && sortDirection === 'asc'
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              'h-3 w-3 -mt-1',
                              sortKey === column.key && sortDirection === 'desc'
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
                {actions && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={getVisibleColumns().length + (actions ? 1 : 0)} className="text-center py-8">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {getVisibleColumns().map((column) => (
                      <TableCell
                        key={String(column.key)}
                        className={cn(
                          'whitespace-nowrap',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {renderCell(column, row, index)}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {actions(row, index)}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSizeState) + 1} to {Math.min(currentPage * pageSizeState, filteredData.length)} of {filteredData.length} results
            </span>
            <Select value={String(pageSizeState)} onValueChange={(value) => setPageSizeState(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
