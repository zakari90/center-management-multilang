"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
}

export interface GenericDataTableProps<T = any> {
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  description?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  rowKey?: keyof T | ((row: T) => string);
  emptyMessage?: string;
  className?: string;
  translations?: {
    previous: string;
    next: string;
    pageOf: string; // "Page {current} of {total}"
    result: string;
    results: string;
    yes: string;
    no: string;
    actions: string;
    noData: string;
  };
}

export function GenericDataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Search...",
  pageSize = 5,
  onView,
  onEdit,
  onDelete,
  rowKey = "id",
  emptyMessage = "No data available",
  className,
  translations = {
    previous: "Previous",
    next: "Next",
    pageOf: "Page {current} of {total}",
    result: "result",
    results: "results",
    yes: "Yes",
    no: "No",
    actions: "Actions",
    noData: "No data available",
  },
}: GenericDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Get row key
  const getRowKey = (row: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(row);
    }
    return row[rowKey]?.toString() || index.toString();
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((row) => {
      return columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : row[col.key];
        return value
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const col = columns.find((c) => c.key === sortConfig.key);
      const aValue = col?.accessor ? col.accessor(a) : a[sortConfig.key];
      const bValue = col?.accessor ? col.accessor(b) : b[sortConfig.key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sort
  const handleSort = (key: string) => {
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable) return;

    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Render cell value
  const renderCellValue = (col: ColumnDef<T>, row: T) => {
    const value = col.accessor ? col.accessor(row) : row[col.key];

    if (col.render) {
      return col.render(value, row);
    }

    // Default rendering for common types
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? translations.yes : translations.no}
        </Badge>
      );
    }

    if (typeof value === "number") {
      return <span className="font-mono">{value.toLocaleString()}</span>;
    }

    if (
      value instanceof Date ||
      (typeof value === "number" && col.key.includes("At"))
    ) {
      const date = value instanceof Date ? value : new Date(value);
      return <span className="text-sm">{date.toLocaleDateString()}</span>;
    }

    return <span className="truncate max-w-xs">{value.toString()}</span>;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      {(title || description) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-center">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground text-center">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm ">
            <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="ps-8 ml-auto mr-auto"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {sortedData.length}{" "}
            {sortedData.length === 1
              ? translations.result
              : translations.results}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    col.sortable &&
                      "cursor-pointer select-none hover:bg-muted/50",
                    col.width && `w-[${col.width}]`,
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && sortConfig?.key === col.key && (
                      <span className="text-xs">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {(onView || onEdit || onDelete) && (
                <TableHead className="w-[100px]">
                  {translations.actions}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + (onView || onEdit || onDelete ? 1 : 0)
                  }
                  className="h-24 text-center"
                >
                  {emptyMessage || translations.noData}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, index) => (
                <TableRow key={getRowKey(row, index)}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {renderCellValue(col, row)}
                    </TableCell>
                  ))}
                  {(onView || onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {onView && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onView(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onEdit(row)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {translations.pageOf
              .replace("{current}", currentPage.toString())
              .replace("{total}", totalPages.toString())}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              {translations.previous}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {translations.next}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal wrapper for the generic table
export interface GenericDataTableModalProps<
  T = any,
> extends GenericDataTableProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modalTitle?: string;
  modalDescription?: string;
  dir?: "ltr" | "rtl" | "auto";
}

export function GenericDataTableModal<T extends Record<string, any>>({
  open,
  onOpenChange,
  modalTitle,
  modalDescription,
  dir,
  ...tableProps
}: GenericDataTableModalProps<T>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] lg:max-w-7xl max-h-[90vh] overflow-y-auto"
        dir={dir}
      >
        <DialogHeader>
          {modalTitle && <DialogTitle>{modalTitle}</DialogTitle>}
          {modalDescription && (
            <DialogDescription>{modalDescription}</DialogDescription>
          )}
        </DialogHeader>
        <GenericDataTable {...tableProps} />
      </DialogContent>
    </Dialog>
  );
}
