const MONITOR_URL = import.meta.env.VITE_MONITOR_URL || "http://localhost:3000";
const WS_URL = import.meta.env.VITE_MONITOR_WS_URL || "ws://localhost:3000";

export interface PeerInfo {
  ip: string;
  port: number;
  country: string | null;
  client: string;
  downloadSpeed: number;
  uploadSpeed: number;
  isSeeder: boolean;
  isDownloading: boolean;
  isUploading: boolean;
}

export interface TorrentDetail {
  torrent: string;
  torrent_id: number;
  upload: number;
  download: number;
  peers: PeerInfo[];
}

export interface Snapshot {
  id?: number;
  timestamp: number;
  upload: number | null;
  download: number | null;
  details: TorrentDetail[];
}

export interface SnapshotsResponse {
  count: number;
  snapshots: Snapshot[];
}

export const fetchSnapshots = async (
  seconds: number
): Promise<SnapshotsResponse> => {
  const response = await fetch(`${MONITOR_URL}/snapshots?seconds=${seconds}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch snapshots: ${response.statusText}`);
  }
  return response.json();
};

export const fetchSnapshotsByRange = async (
  from: number,
  to: number
): Promise<SnapshotsResponse> => {
  const response = await fetch(
    `${MONITOR_URL}/snapshots?from=${from}&to=${to}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch snapshots: ${response.statusText}`);
  }
  return response.json();
};

export const createSnapshotWebSocket = (
  onSnapshot: (snapshot: Snapshot) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket => {
  const ws = new WebSocket(WS_URL);

  ws.onmessage = (event) => {
    try {
      const snapshot: Snapshot = JSON.parse(event.data);
      onSnapshot(snapshot);
    } catch (error) {
      console.error("Failed to parse snapshot:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log("WebSocket closed");
    onClose?.();
  };

  return ws;
};
