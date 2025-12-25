import {
  createSnapshotWebSocket,
  fetchSnapshots,
  type PeerInfo,
  type Snapshot,
  type TorrentDetail,
} from "@/lib/monitor";
import { useCallback, useEffect, useRef, useState } from "react";

// Simplified torrent info for graph display (without peer details)
export interface GraphTorrentDetail {
  torrent: string;
  torrent_id: number;
  upload: number;
  download: number;
}

export interface GraphData {
  date: number;
  upload: number;
  download: number;
  details: GraphTorrentDetail[];
}

export type { PeerInfo, TorrentDetail };

interface UseSnapshotsOptions {
  initialSeconds?: number;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export const useSnapshots = (options: UseSnapshotsOptions = {}) => {
  const {
    initialSeconds = 300,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [data, setData] = useState<GraphData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Strip peer data to reduce memory usage
  const snapshotToGraphData = (snapshot: Snapshot): GraphData => ({
    date: snapshot.timestamp,
    upload: snapshot.upload ?? 0,
    download: snapshot.download ?? 0,
    details: (snapshot.details ?? []).map((d) => ({
      torrent: d.torrent,
      torrent_id: d.torrent_id,
      upload: d.upload,
      download: d.download,
    })),
  });

  const loadInitialData = useCallback(async (seconds: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchSnapshots(seconds);
      const graphData = response.snapshots.map(snapshotToGraphData);
      setData(graphData);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load snapshots");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    wsRef.current = createSnapshotWebSocket(
      (snapshot) => {
        const graphData = snapshotToGraphData(snapshot);
        setData((prev) => {
          // Keep last 24 hours of data
          const cutoff = Date.now() - 24 * 60 * 60 * 1000;
          const filtered = prev.filter((d) => d.date > cutoff);
          return [...filtered, graphData];
        });
      },
      () => {
        setIsConnected(false);
        setError("WebSocket error");
      },
      () => {
        setIsConnected(false);
        if (autoReconnect) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, reconnectDelay);
        }
      }
    );

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setError(null);
    };
  }, [autoReconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const loadMoreData = useCallback(async (seconds: number) => {
    try {
      const response = await fetchSnapshots(seconds);
      const graphData = response.snapshots.map(snapshotToGraphData);
      setData(graphData);
    } catch (err) {
      console.error("Failed to load more data:", err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      // First fetch historical data via REST API
      await loadInitialData(initialSeconds);
      // Then connect to WebSocket for live updates
      connect();
    };

    init();

    return () => {
      disconnect();
    };
  }, [initialSeconds]);

  return {
    data,
    isConnected,
    isLoading,
    error,
    loadMoreData,
    reconnect: connect,
    disconnect,
  };
};

export type UseSnapshotsReturn = ReturnType<typeof useSnapshots>;
