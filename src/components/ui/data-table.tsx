"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface DataTableAction<TData> {
  label: string;
  onClick: (row: TData) => void;
  separator?: boolean;
}

interface DataTableProps<TData, TValue> {
  className?: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  // Feature toggles
  enableSorting?: boolean;
  enableFiltering?: boolean;
  filterColumn?: string;
  filterPlaceholder?: string;
  enableColumnVisibility?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  enableActions?: boolean;
  actions?: DataTableAction<TData>[];
  // Selection callback
  onRowSelectionChange?: (selectedRows: TData[]) => void;
}

export function DataTable<TData, TValue>({
  className,
  columns: userColumns,
  data,
  enableSorting = false,
  enableFiltering = false,
  filterColumn = "name",
  filterPlaceholder = "Filter...",
  enableColumnVisibility = false,
  enableRowSelection = false,
  enablePagination = false,
  pageSize = 10,
  enableActions = false,
  actions = [],
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Build columns with optional select and actions columns
  const columns = React.useMemo(() => {
    const cols: ColumnDef<TData, TValue>[] = [];

    // Add select column if row selection is enabled
    if (enableRowSelection) {
      cols.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }

    // Add user columns
    cols.push(...userColumns);

    // Add actions column if actions are enabled
    if (enableActions && actions.length > 0) {
      cols.push({
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const rowData = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {actions.map((action, index) => (
                  <React.Fragment key={index}>
                    {action.separator && <DropdownMenuSeparator />}
                    <DropdownMenuItem onClick={() => action.onClick(rowData)}>
                      {action.label}
                    </DropdownMenuItem>
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      } as ColumnDef<TData, TValue>);
    }

    return cols;
  }, [userColumns, enableRowSelection, enableActions, actions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination && {
      getPaginationRowModel: getPaginationRowModel(),
      initialState: {
        pagination: {
          pageSize,
        },
      },
    }),
    ...(enableSorting && {
      onSortingChange: setSorting,
      getSortedRowModel: getSortedRowModel(),
    }),
    ...(enableFiltering && {
      onColumnFiltersChange: setColumnFilters,
      getFilteredRowModel: getFilteredRowModel(),
    }),
    ...(enableColumnVisibility && {
      onColumnVisibilityChange: setColumnVisibility,
    }),
    ...(enableRowSelection && {
      onRowSelectionChange: setRowSelection,
    }),
    state: {
      ...(enableSorting && { sorting }),
      ...(enableFiltering && { columnFilters }),
      ...(enableColumnVisibility && { columnVisibility }),
      ...(enableRowSelection && { rowSelection }),
    },
  });

  // Call onRowSelectionChange when selection changes
  React.useEffect(() => {
    if (onRowSelectionChange && enableRowSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, enableRowSelection, table]);

  return (
    <div className="w-full h-full flex flex-col justify-between">
      {/* Toolbar */}
      {(enableFiltering || enableColumnVisibility) && (
        <div className="flex items-center py-4 px-4">
          {enableFiltering && (
            <Input
              placeholder={filterPlaceholder}
              value={
                (table.getColumn(filterColumn)?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn(filterColumn)
                  ?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          )}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl">
        <Table className={className}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination & Selection Info */}
      {(enablePagination || enableRowSelection) && (
        <div className="flex items-center justify-between space-x-2 py-4 px-4">
          {enableRowSelection && (
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          )}
          {enablePagination && (
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
