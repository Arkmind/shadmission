import type { useSnapshots } from "@/hooks/use-snapshots";
import type { Dispatch, SetStateAction } from "react";

export interface SelectionRange {
  startTimestamp: number;
  endTimestamp: number;
}

export interface AggregatedTorrent {
  torrent: string;
  torrent_id: number;
  totalUpload: number;
  totalDownload: number;
  avgUpload: number;
  avgDownload: number;
  snapshotCount: number;
  peers: Map<string, AggregatedPeer>;
}

export interface AggregatedPeer {
  ip: string;
  port: number;
  country: string | null;
  client: string;
  totalDownloadSpeed: number;
  totalUploadSpeed: number;
  avgDownloadSpeed: number;
  avgUploadSpeed: number;
  isSeeder: boolean;
  snapshotCount: number;
}

export interface GraphSelectableContextType {
  confirmedSelection: SelectionRange | null;
  setConfirmedSelection: (selection: SelectionRange | null) => void;
  aggregatedData: AggregatedTorrent[] | null;
  snapshotCount: number;
  isConnected: boolean;
  timeRange: number;
  setTimeRange: Dispatch<SetStateAction<number>>;
  endTimeOffset: number;
  setEndTimeOffset: Dispatch<SetStateAction<number>>;
  isLive: boolean;
  clearSelection: () => void;
  data: ReturnType<typeof useSnapshots>["data"];
  isLoading: boolean;
  error: string | null;
}
