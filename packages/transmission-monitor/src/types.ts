// Re-export types for external use
export type { MonitorConfig, TorrentInfo, TransferStats } from "./monitor.js";

// WebSocket message types
export interface WSMessage {
  type: "stats" | "torrent-update" | "error";
  data: unknown;
}

export interface StatsMessage extends WSMessage {
  type: "stats";
  data: import("./monitor.js").TransferStats;
}

export interface TorrentUpdateMessage extends WSMessage {
  type: "torrent-update";
  data: import("./monitor.js").TorrentInfo[];
}

export interface ErrorMessage extends WSMessage {
  type: "error";
  data: { message: string };
}
