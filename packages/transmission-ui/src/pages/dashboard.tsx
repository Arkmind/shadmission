import { GluetunStatus } from "@/components/gluetun";
import { Graph } from "@/components/graph";
import { LiveTransfer } from "@/components/live-transfer";
import { SessionStatus } from "@/components/session-status";
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
import { GLUETUN_ENABLED } from "@/lib/gluetun";
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-min xl:grid-rows-6 gap-3 h-full">
      {/* Graph & Live Transfer */}
      <Card className="rounded-xl xl:row-span-2 py-4 px-0">
        <CardContent className="h-full flex flex-col space-y-4 px-1">
          <LiveTransfer />
          <Graph />
        </CardContent>
      </Card>

      {/* Session Status & Gluetun */}
      <div className="xl:row-span-4 xl:row-start-3 flex flex-col space-y-3">
        <Card className="rounded-xl flex-1 py-0 overflow-hidden min-h-50">
          <CardContent className="h-full p-0">
            <SessionStatus torrents={data?.torrents} />
          </CardContent>
        </Card>
        {GLUETUN_ENABLED && (
          <Card className="rounded-xl py-0">
            <CardContent className="h-full p-0">
              <GluetunStatus />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Torrent list */}
      <div
        className={cn(
          "md:col-span-2 xl:col-span-3 py-0 flex flex-col space-y-2 min-h-75 xl:min-h-0",
          torrent ? "xl:row-span-3" : "xl:row-span-full"
        )}
      >
        <Card className="rounded-xl p-1">
          <CardContent className="p-0">
            <TorrentListFilter
              selectedTorrents={selectedTorrents}
              availableLabels={availableLabels}
              availableTrackers={availableTrackers}
              filters={filters}
              onFiltersChange={setFilters}
              onUpdate={refreshFn ?? undefined}
            />
          </CardContent>
        </Card>
        <Card className="rounded-xl flex-1 py-0 min-h-62.5 xl:min-h-0">
          <CardContent className="h-full p-0">
            <TorrentList
              onClick={handleClick}
              onUpdate={handleUpdate}
              onSelect={setSelectedTorrents}
              onDataChange={setData}
              onRefresh={handleRefresh}
              filteredTorrents={filteredTorrents}
            />
          </CardContent>
        </Card>
      </div>

      {/* Data from selected torrent */}
      {torrent && (
        <Card className="rounded-xl md:col-span-2 xl:col-span-3 xl:row-span-3 py-0 min-h-75 xl:min-h-0">
          <CardContent className="h-full p-0">
            <TorrentInfo torrent={torrent} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
