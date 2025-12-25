import { client } from "@/lib/transmission";
import { formatBytes, formatEta, formatSpeed } from "@/lib/utils";
import {
  type AllClientData,
  type NormalizedTorrent,
} from "@ctrl/shared-torrent";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState, type FC } from "react";
import { ButtonTable } from "./ui/button-table";
import { DataTable } from "./ui/data-table";
import { Progress } from "./ui/progress";

const columns: ColumnDef<NormalizedTorrent>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
  },
  {
    accessorKey: "progress",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Progress
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => {
      const progress = row.getValue<number>("progress") * 100;
      return (
        <div className="flex items-center gap-2 min-w-50">
          <span className="text-xs text-muted-foreground text-right">
            {progress.toFixed(1)}%
          </span>
          <Progress value={progress} className="flex-1" />
        </div>
      );
    },
  },
  {
    accessorKey: "eta",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ETA
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatEta(row.getValue<number>("eta")),
  },
  {
    accessorKey: "downloadSpeed",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Download
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatSpeed(row.getValue<number>("downloadSpeed")),
  },
  {
    accessorKey: "uploadSpeed",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Upload
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatSpeed(row.getValue<number>("uploadSpeed")),
  },
  {
    accessorKey: "totalSize",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Size
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatBytes(row.getValue<number>("totalSize")),
  },
  {
    accessorKey: "totalDownloaded",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Downloaded
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatBytes(row.getValue<number>("totalDownloaded")),
  },
  {
    accessorKey: "totalUploaded",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Uploaded
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => formatBytes(row.getValue<number>("totalUploaded")),
  },
  {
    accessorKey: "ratio",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Ratio
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => row.getValue<number>("ratio").toFixed(2),
  },
  {
    accessorKey: "dateAdded",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Added
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("dateAdded"));
      return date.toLocaleDateString();
    },
  },
];

export const TorrentList: FC = () => {
  const [data, setData] = useState<AllClientData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(
    setTimeout(() => {})
  );

  const getAllData = async () => {
    const list = await client.getAllData();
    setData(list);

    timeoutRef.current = setTimeout(getAllData, 1000);
  };

  useEffect(() => {
    getAllData();

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <DataTable
      className="rounded-xl h-full"
      columns={columns}
      data={data?.torrents || []}
      enableSorting
      enableRowSelection
    />
  );
};
