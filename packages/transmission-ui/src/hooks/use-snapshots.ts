import { debounce } from "@/lib/debounce";
import {
  createSnapshotWebSocket,
  fetchSnapshots,
  fetchSnapshotsByRange,
  type Snapshot,
} from "@/lib/monitor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseSnapshotsOptions {
  seconds?: number;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  bufferSize?: number;
}

export const useSnapshots = ({
  seconds = 300,
  autoReconnect = true,
  reconnectDelay = 3000,
  bufferSize = 1000,
}: UseSnapshotsOptions = {}) => {
  const [, forceUpdate] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const isLiveRef = useRef(true);
  const dataRef = useRef<Snapshot[]>([]);
  const connectRef = useRef<() => void>(null);

  const setData = useCallback(
    (newData: Snapshot[] | ((prev: Snapshot[]) => Snapshot[])) => {
      if (typeof newData === "function") {
        dataRef.current = newData(dataRef.current);
      } else {
        dataRef.current = newData;
      }
      forceUpdate((n) => n + 1);
    },
    []
  );

  const updateSnapshot = useCallback(
    async ({
      from,
      to,
      seconds,
      offset,
    }: {
      from?: number;
      to?: number;
      seconds?: number;
      offset?: number;
    }) => {
      if (offset !== undefined && offset > 0) {
        isLiveRef.current = false;
      } else {
        isLiveRef.current = true;
      }

      if (seconds !== undefined) {
        const snapshots = await fetchSnapshots(seconds);
        setData(snapshots.snapshots);
      } else if (from !== undefined && to !== undefined) {
        const snapshots = await fetchSnapshotsByRange(from, to);
        setData(snapshots.snapshots);
      }
    },
    [setData]
  );

  const updateSnapshotDebounced = useMemo(
    () => debounce(updateSnapshot, 500),
    []
  );

  const connect = useCallback(() => {
    if (wsRef.current) {
      return;
    }

    const ws = createSnapshotWebSocket(
      (snapshot) => {
        setData((prevData) => {
          if (isLiveRef.current) {
            if (prevData.length >= bufferSize) {
              return [...prevData.slice(1), snapshot];
            }
            return [...prevData, snapshot];
          }
          return prevData;
        });
        setIsConnected(true);
        setError(null);
      },
      (err) => {
        setError(`WebSocket error: ${err.type}`);
      },
      () => {
        setIsConnected(false);
        wsRef.current = null;
        if (autoReconnect) {
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connectRef.current?.();
          }, reconnectDelay);
        }
      }
    );

    wsRef.current = ws;
  }, [autoReconnect, reconnectDelay]);

  connectRef.current = connect;

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchSnapshots(seconds)
      .then((response) => {
        setData(response.snapshots);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(`Failed to fetch snapshots: ${err.message}`);
        setIsLoading(false);
      });

    connect();

    return () => {
      disconnect();
    };
  }, [seconds, connect, disconnect]);

  return {
    data: dataRef.current ?? [],
    isConnected,
    isLoading,
    error,
    updateSnapshot: updateSnapshotDebounced,
    reconnect: connect,
    disconnect,
  };
};

export type UseSnapshotsReturn = ReturnType<typeof useSnapshots>;
