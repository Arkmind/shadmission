import { client } from "@/lib/transmission";
import { formatBytes, formatEta, formatSpeed } from "@/lib/utils";
import {
  type AllClientData,
  type NormalizedTorrent,
} from "@ctrl/shared-torrent";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import { TorrentAction } from "./torrent-action";
import { ButtonTable } from "./ui/button-table";
import { DataTable } from "./ui/data-table";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";

// Get row class based on torrent state
const getRowClassName = (torrent: NormalizedTorrent): string => {
  if (torrent.state === "error") {
    return "bg-red-500/10 hover:bg-red-500/20";
  }
  if (torrent.state === "checking") {
    return "bg-purple-500/10 hover:bg-purple-500/20";
  }
  if (torrent.state === "paused") {
    return "bg-muted/50 hover:bg-muted/70 text-muted-foreground";
  }
  if (torrent.state === "seeding" && torrent.uploadSpeed > 0) {
    return "bg-blue-500/10 hover:bg-blue-500/20";
  }
  if (torrent.state === "downloading" && torrent.downloadSpeed > 0) {
    return "bg-green-500/10 hover:bg-green-500/20";
  }
  if (torrent.state === "queued") {
    return "bg-muted/30 hover:bg-muted/50";
  }

  return "";
};

const createColumns = (
  onUpdate?: () => void
): ColumnDef<NormalizedTorrent>[] => [
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
    cell: ({ row }) => (
      <span className="block truncate" title={row.getValue<string>("name")}>
        {row.getValue<string>("name")}
      </span>
    ),
    size: 250,
    minSize: 100,
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
    size: 150,
    minSize: 100,
    cell: ({ row }) => {
      const progress = row.getValue<number>("progress") * 100;
      const isChecking = row.original.state === "checking";

      if (isChecking) {
        const recheckProgress =
          ((row.original as unknown as { recheckProgress: number })
            .recheckProgress ?? 0) * 100;
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs text-purple-500 text-right animate-pulse w-10 shrink-0">
              {recheckProgress.toFixed(1)}%
            </span>
            <Progress
              value={recheckProgress}
              className="flex-1 [&>div]:bg-purple-500 [&>div]:animate-pulse"
            />
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground text-right w-10 shrink-0">
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
    size: 80,
    minSize: 50,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatEta(row.getValue<number>("eta"))}
      </span>
    ),
  },
  {
    accessorKey: "downloadSpeed",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Down
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    size: 90,
    minSize: 60,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatSpeed(row.getValue<number>("downloadSpeed"))}
      </span>
    ),
  },
  {
    accessorKey: "uploadSpeed",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Up
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    size: 90,
    minSize: 60,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatSpeed(row.getValue<number>("uploadSpeed"))}
      </span>
    ),
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
    size: 80,
    minSize: 60,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatBytes(row.getValue<number>("totalSize"))}
      </span>
    ),
  },
  {
    accessorKey: "totalDownloaded",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        DL'd
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    size: 80,
    minSize: 60,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatBytes(row.getValue<number>("totalDownloaded"))}
      </span>
    ),
  },
  {
    accessorKey: "totalUploaded",
    header: ({ column }) => (
      <ButtonTable
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        UL'd
        <ArrowUpDown className="h-2 w-2" />
      </ButtonTable>
    ),
    size: 80,
    minSize: 60,
    cell: ({ row }) => (
      <span className="block truncate">
        {formatBytes(row.getValue<number>("totalUploaded"))}
      </span>
    ),
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
    size: 60,
    minSize: 45,
    cell: ({ row }) => (
      <span className="block truncate">
        {row.getValue<number>("ratio").toFixed(2)}
      </span>
    ),
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
    size: 85,
    minSize: 70,
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("dateAdded"));
      return (
        <span className="block truncate">{date.toLocaleDateString()}</span>
      );
    },
  },
  {
    accessorKey: "actions",
    header: "",
    cell: ({ row }) => (
      <TorrentAction torrents={row.original} onUpdate={onUpdate} />
    ),
    enableSorting: false,
    enableResizing: false,
    size: 50,
  },
];

export interface TorrentListProps {
  onSelect?: (torrents: NormalizedTorrent[]) => void;
  onClick?: (torrent: NormalizedTorrent | null) => void;
  onUpdate?: (torrent: NormalizedTorrent) => void;
  onDataChange?: (data: AllClientData | null) => void;
  onRefresh?: (refreshFn: () => void) => void;
  filteredTorrents?: NormalizedTorrent[];
}

export const TorrentList: FC<TorrentListProps> = ({
  onClick,
  onUpdate,
  onSelect,
  onDataChange,
  onRefresh,
  filteredTorrents,
}) => {
  const [data, setData] = useState<AllClientData | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickedTorrentRef = useRef<NormalizedTorrent | null>(null);
  const isMountedRef = useRef(true);
  const getAllDataRef = useRef<(() => Promise<void>) | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep refs in sync
  onUpdateRef.current = onUpdate;

  const handleClick = (torrent: NormalizedTorrent) => {
    if (clickedTorrentRef.current?.id === torrent.id) {
      clickedTorrentRef.current = null;
      onClick?.(null);
      return;
    }

    clickedTorrentRef.current = torrent;
    onClick?.(torrent);
  };

  const getAllData = useCallback(async () => {
    // Prevent fetching if unmounted
    if (!isMountedRef.current) return;

    // Clear any existing timeout to prevent duplicate calls
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      const list = await client.getAllData();

      // Check again after async operation
      if (!isMountedRef.current) return;

      setData(list);

      if (clickedTorrentRef.current) {
        const updatedTorrent = list.torrents.find(
          (t) => t.id === clickedTorrentRef.current?.id
        );
        if (updatedTorrent) {
          onUpdateRef.current?.(updatedTorrent);
        }
      }
    } catch (error) {
      console.error("Failed to fetch torrent data:", error);
    }

    // Schedule next fetch only if still mounted
    if (isMountedRef.current) {
      timeoutRef.current = setTimeout(() => getAllDataRef.current?.(), 1000);
    }
  }, []);

  // Keep ref in sync with latest getAllData
  getAllDataRef.current = getAllData;

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(() => createColumns(getAllData), [getAllData]);

  useEffect(() => {
    isMountedRef.current = true;
    getAllData();

    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [getAllData]);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange?.(data);
  }, [data, onDataChange]);

  // Expose refresh function to parent
  useEffect(() => {
    onRefresh?.(getAllData);
  }, [getAllData, onRefresh]);

  // Determine which torrents to display
  const displayTorrents = filteredTorrents ?? data?.torrents ?? [];

  return (
    <ScrollArea className="h-full">
      <DataTable
        className="h-full"
        columns={columns}
        data={displayTorrents}
        enableSorting
        enableRowSelection
        enableColumnResizing
        columnSizingStorageKey="torrent-list-column-sizes"
        onClickRow={handleClick}
        rowClassName={getRowClassName}
        onRowSelectionChange={onSelect}
      />
    </ScrollArea>
  );
};
