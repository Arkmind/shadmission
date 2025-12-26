import { Transmission } from "@ctrl/transmission";

export const client = new Transmission({
  baseUrl: import.meta.env.VITE_TRANSMISSION_URL || "http://localhost:9091",
  username: import.meta.env.VITE_TRANSMISSION_USER || "arky",
  password: import.meta.env.VITE_TRANSMISSION_PASS || "arky",
});

export interface SessionStats {
  uploadedBytes: number;
  downloadedBytes: number;
  filesAdded: number;
  sessionCount: number;
  secondsActive: number;
}

export interface SessionStatsResponse {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
  "cumulative-stats": SessionStats;
  "current-stats": SessionStats;
}

export const getSessionStats = async (): Promise<SessionStatsResponse> => {
  const response = await client.request<{ arguments: SessionStatsResponse }>(
    "session-stats"
  );
  return response._data?.arguments as SessionStatsResponse;
};
