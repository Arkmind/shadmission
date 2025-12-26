import { useSnapshots } from "@/hooks/use-snapshots";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from "react";
import type {
  AggregatedPeer,
  AggregatedTorrent,
  GraphSelectableContextType,
  SelectionRange,
} from "./types";

const GraphSelectableContext = createContext<GraphSelectableContextType | null>(
  null
);

export const useGraphSelectable = () => {
  const context = useContext(GraphSelectableContext);
  if (!context) {
    throw new Error(
      "useGraphSelectable must be used within GraphSelectableProvider"
    );
  }
  return context;
};

interface GraphSelectableProviderProps {
  children: ReactNode;
}

export const GraphSelectableProvider: FC<GraphSelectableProviderProps> = ({
  children,
}) => {
  const [bufferSize, setBufferSize] = useState<number | undefined>(undefined);
  const { data, isConnected, isLoading, error, updateSnapshot } = useSnapshots({
    seconds: 3600,
    bufferSize: bufferSize || 3600,
  });

  const [timeRange, setTimeRange] = useState(3600 * 1000);
  const [endTimeOffset, setEndTimeOffset] = useState(0);
  const [confirmedSelection, setConfirmedSelection] =
    useState<SelectionRange | null>(null);

  const isLive = useMemo(() => endTimeOffset === 0, [endTimeOffset]);

  // Use selected data if there's a selection, otherwise use current visible timeRange
  const selectedData = useMemo(() => {
    if (confirmedSelection) {
      const { startTimestamp, endTimestamp } = confirmedSelection;
      const minTs = Math.min(startTimestamp, endTimestamp);
      const maxTs = Math.max(startTimestamp, endTimestamp);
      return data.filter(
        (snapshot) => snapshot.timestamp >= minTs && snapshot.timestamp <= maxTs
      );
    }
    // Default to current visible timeRange based on timeRange and offset
    const now = Date.now();
    const endTime = now - endTimeOffset;
    const startTime = endTime - timeRange;
    return data.filter(
      (snapshot) =>
        snapshot.timestamp >= startTime && snapshot.timestamp <= endTime
    );
  }, [confirmedSelection, data, timeRange, endTimeOffset]);

  const aggregatedData = useMemo(() => {
    if (selectedData.length === 0) return null;

    const torrentsMap = new Map<number, AggregatedTorrent>();

    for (const snapshot of selectedData) {
      if (!snapshot.details) continue;
      for (const detail of snapshot.details) {
        let torrent = torrentsMap.get(detail.torrent_id);
        if (!torrent) {
          torrent = {
            torrent: detail.torrent,
            torrent_id: detail.torrent_id,
            totalUpload: 0,
            totalDownload: 0,
            avgUpload: 0,
            avgDownload: 0,
            snapshotCount: 0,
            peers: new Map<string, AggregatedPeer>(),
          };
          torrentsMap.set(detail.torrent_id, torrent);
        }

        torrent.totalUpload += detail.upload;
        torrent.totalDownload += detail.download;
        torrent.snapshotCount += 1;

        if (detail.peers) {
          for (const peer of detail.peers) {
            const peerKey = `${peer.ip}:${peer.port}`;
            let aggregatedPeer = torrent.peers.get(peerKey);
            if (!aggregatedPeer) {
              aggregatedPeer = {
                ip: peer.ip,
                port: peer.port,
                country: peer.country,
                client: peer.client,
                totalDownloadSpeed: 0,
                totalUploadSpeed: 0,
                avgDownloadSpeed: 0,
                avgUploadSpeed: 0,
                isSeeder: peer.isSeeder,
                snapshotCount: 0,
              };
              torrent.peers.set(peerKey, aggregatedPeer);
            }
            aggregatedPeer.totalDownloadSpeed += peer.downloadSpeed;
            aggregatedPeer.totalUploadSpeed += peer.uploadSpeed;
            aggregatedPeer.snapshotCount += 1;
          }
        }
      }
    }

    for (const torrent of torrentsMap.values()) {
      torrent.avgUpload = torrent.totalUpload / torrent.snapshotCount;
      torrent.avgDownload = torrent.totalDownload / torrent.snapshotCount;
      for (const peer of torrent.peers.values()) {
        peer.avgDownloadSpeed = peer.totalDownloadSpeed / peer.snapshotCount;
        peer.avgUploadSpeed = peer.totalUploadSpeed / peer.snapshotCount;
      }
    }

    return Array.from(torrentsMap.values()).sort(
      (a, b) => b.avgDownload + b.avgUpload - (a.avgDownload + a.avgUpload)
    );
  }, [selectedData]);

  const clearSelection = useCallback(() => {
    setConfirmedSelection(null);
  }, []);

  useEffect(() => {
    setBufferSize(
      Math.abs(
        Date.now() - endTimeOffset - Date.now() - timeRange - endTimeOffset
      ) /
        1000 +
        5
    );
    updateSnapshot({
      from: Date.now() - timeRange - endTimeOffset,
      to: Date.now() - endTimeOffset,
      offset: endTimeOffset,
    });
  }, [timeRange, endTimeOffset, updateSnapshot]);

  const value = useMemo(
    () => ({
      confirmedSelection,
      setConfirmedSelection,
      aggregatedData,
      snapshotCount: selectedData.length,
      isConnected,
      timeRange,
      setTimeRange,
      endTimeOffset,
      setEndTimeOffset,
      isLive,
      clearSelection,
      data,
      isLoading,
      error,
    }),
    [
      confirmedSelection,
      aggregatedData,
      selectedData,
      isConnected,
      timeRange,
      endTimeOffset,
      isLive,
      clearSelection,
      data,
      isLoading,
      error,
    ]
  );

  return (
    <GraphSelectableContext.Provider value={value}>
      {children}
    </GraphSelectableContext.Provider>
  );
};
