import { ScrollArea } from "@/components/ui/scroll-area";
import { formatSpeed, formatTime } from "@/lib/utils";
import { useMemo, type FC } from "react";
import { useGraphSelectable } from "./context";
import type { AggregatedPeer } from "./types";

export const SelectionInfo: FC = () => {
  const {
    confirmedSelection,
    aggregatedData,
    snapshotCount,
    isConnected,
    timeRange,
    isLive,
    endTimeOffset,
  } = useGraphSelectable();

  const totalDownload =
    aggregatedData?.reduce((sum, t) => sum + t.avgDownload, 0) ?? 0;
  const totalUpload =
    aggregatedData?.reduce((sum, t) => sum + t.avgUpload, 0) ?? 0;
  const torrentCount = aggregatedData?.length ?? 0;
  const totalPeers =
    aggregatedData?.reduce((sum, t) => sum + t.peers.size, 0) ?? 0;

  // Get all unique peers
  const allPeers = useMemo(() => {
    if (!aggregatedData) return [];
    const peersMap = new Map<
      string,
      AggregatedPeer & { torrentName: string }
    >();
    for (const torrent of aggregatedData) {
      for (const [key, peer] of torrent.peers) {
        if (!peersMap.has(key)) {
          peersMap.set(key, { ...peer, torrentName: torrent.torrent });
        }
      }
    }
    return Array.from(peersMap.values()).sort(
      (a, b) =>
        b.avgDownloadSpeed +
        b.avgUploadSpeed -
        (a.avgDownloadSpeed + a.avgUploadSpeed)
    );
  }, [aggregatedData]);

  return (
    <div className="h-full flex flex-col p-4 select-none">
      {/* Connection & Time Status */}
      <div className="space-y-3 pb-4 border-b">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Time Range</div>
            <div className="font-medium">{formatTime(timeRange / 1000)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="font-medium">
              {isLive ? "Live" : formatTime(endTimeOffset / 1000) + " ago"}
            </div>
          </div>
        </div>
      </div>

      {/* Selection Info */}
      {confirmedSelection ? (
        <>
          <div className="space-y-3 py-4 border-b">
            <div className="text-sm font-medium">Selection</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Start</div>
                <div className="font-mono text-xs">
                  {new Date(
                    Math.min(
                      confirmedSelection.startTimestamp,
                      confirmedSelection.endTimestamp
                    )
                  ).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">End</div>
                <div className="font-mono text-xs">
                  {new Date(
                    Math.max(
                      confirmedSelection.startTimestamp,
                      confirmedSelection.endTimestamp
                    )
                  ).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="font-medium">
                  {formatTime(
                    Math.abs(
                      confirmedSelection.endTimestamp -
                        confirmedSelection.startTimestamp
                    ) / 1000
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Snapshots</div>
                <div className="font-medium">{snapshotCount}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3 py-4 border-b">
            <div className="text-sm font-medium">Statistics</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--color-download)" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Avg Download
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {formatSpeed(totalDownload)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: "var(--color-upload)" }}
                  />
                  <span className="text-xs text-muted-foreground">
                    Avg Upload
                  </span>
                </div>
                <div className="text-sm font-medium">
                  {formatSpeed(totalUpload)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Torrents</div>
                <div className="text-lg font-semibold">{torrentCount}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">
                  Unique Peers
                </div>
                <div className="text-lg font-semibold">{totalPeers}</div>
              </div>
            </div>
          </div>

          {/* Peers List */}
          <div className="flex-1 min-h-0 pt-4">
            <div className="text-sm font-medium mb-2">Top Peers</div>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-2 pr-2">
                {allPeers.slice(0, 20).map((peer) => (
                  <div
                    key={`${peer.ip}:${peer.port}`}
                    className="text-xs p-2 bg-muted/30 rounded"
                  >
                    <div
                      className="font-mono truncate"
                      title={`${peer.ip}:${peer.port}`}
                    >
                      {peer.ip}
                    </div>
                    <div
                      className="text-muted-foreground truncate"
                      title={peer.client}
                    >
                      {peer.client || "Unknown client"}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>↓ {formatSpeed(peer.avgDownloadSpeed)}</span>
                      <span>↑ {formatSpeed(peer.avgUploadSpeed)}</span>
                    </div>
                  </div>
                ))}
                {allPeers.length === 0 && (
                  <div className="text-muted-foreground text-center py-4">
                    No peers
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center p-4">
          Select a time range on the graph to view details
        </div>
      )}
    </div>
  );
};
