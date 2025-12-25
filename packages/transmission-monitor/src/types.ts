// Re-export types for external use
export type { Snapshot, TorrentDetail } from "./database.js";
export type { PeerInfo, TorrentTransfer } from "./monitor.js";

// WebSocket message types
export interface WSMessage {
  type: "snapshot" | "error";
  data: unknown;
}

export interface SnapshotMessage extends WSMessage {
  type: "snapshot";
  data: import("./database.js").Snapshot;
}

export interface ErrorMessage extends WSMessage {
  type: "error";
  data: { message: string };
}
