import { Graph } from "@/components/graph";
import { LiveTransfer } from "@/components/live-transfer";
import { TorrentInfo } from "@/components/torrent-info";
import { TorrentList } from "@/components/torrent-list";
import {
  extractLabels,
  extractTrackers,
  filterTorrents,
  TorrentListFilter,
  type TorrentFilters,
} from "@/components/torrent-list-filter";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AllClientData, NormalizedTorrent } from "@ctrl/shared-torrent";
import type React from "react";
import { useCallback, useMemo, useState } from "react";

const DEFAULT_FILTERS: TorrentFilters = {
  search: "",
  state: "all",
  priority: "all",
  labels: [],
  trackers: [],
};

export const Dashboard: React.FC = () => {
  const [torrent, setTorrent] = useState<NormalizedTorrent | null>(null);
  const [selectedTorrents, setSelectedTorrents] = useState<NormalizedTorrent[]>(
    []
  );
  const [data, setData] = useState<AllClientData | null>(null);
  const [filters, setFilters] = useState<TorrentFilters>(DEFAULT_FILTERS);
  const [refreshFn, setRefreshFn] = useState<(() => void) | null>(null);

  const handleClick = (torrent: NormalizedTorrent | null) => {
    setTorrent(torrent);
  };

  const handleUpdate = (torrent: NormalizedTorrent) => {
    if (!torrent) return;
    if (torrent.id !== torrent.id) return;
    setTorrent(torrent);
  };

  const handleRefresh = useCallback((fn: () => void) => {
    setRefreshFn(() => fn);
  }, []);

  // Memoize filtered data
  const filteredTorrents = useMemo(() => {
    const torrents = data?.torrents || [];
    return filterTorrents(torrents, filters);
  }, [data?.torrents, filters]);

  // Memoize available labels and trackers
  const availableLabels = useMemo(
    () => extractLabels(data?.torrents || []),
    [data?.torrents]
  );

  const availableTrackers = useMemo(
    () => extractTrackers(data?.torrents || []),
    [data?.torrents]
  );

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full">
      {/* Graph */}
      <Card className="rounded-xl col-span-1 row-span-2 py-4 px-0">
        <CardContent className="h-full flex flex-col space-y-4 px-1">
          <LiveTransfer />
          <Graph />
        </CardContent>
      </Card>
      {/* Filters */}
      <Card className="rounded-xl col-span-1 row-span-3 row-start-3"></Card>

      {/* Torrent list */}
      <div
        className={cn(
          "col-span-3 py-0 flex flex-col space-y-2",
          torrent ? "row-span-3" : "row-span-full"
        )}
      >
        <Card className="rounded-xl p-2">
          <TorrentListFilter
            selectedTorrents={selectedTorrents}
            availableLabels={availableLabels}
            availableTrackers={availableTrackers}
            filters={filters}
            onFiltersChange={setFilters}
            onUpdate={refreshFn ?? undefined}
          />
        </Card>
        <Card className="rounded-xl flex-1 py-0">
          <TorrentList
            onClick={handleClick}
            onUpdate={handleUpdate}
            onSelect={setSelectedTorrents}
            onDataChange={setData}
            onRefresh={handleRefresh}
            filteredTorrents={filteredTorrents}
          />
        </Card>
      </div>
      {/* Data from selected torrent */}
      {torrent && (
        <Card className="rounded-xl col-span-3 row-span-2 py-0">
          <TorrentInfo torrent={torrent} />
        </Card>
      )}
    </div>
  );
};
