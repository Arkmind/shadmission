import type { NormalizedTorrent } from "@ctrl/shared-torrent";

export interface TorrentTabProps {
  torrent: NormalizedTorrent;
  onUpdate?: () => void;
}

// Types for raw transmission data
export interface RawTorrentData {
  id?: number;
  comment?: string;
  creator?: string;
  isPrivate?: boolean;
  hashString?: string;
  magnetLink?: string;
  downloadDir?: string;
  secondsDownloading?: number;
  secondsSeeding?: number;
  peersConnected?: number;
  peersGettingFromUs?: number;
  peersSendingToUs?: number;
  // Limits
  downloadLimit?: number;
  downloadLimited?: boolean;
  uploadLimit?: number;
  uploadLimited?: boolean;
  honorsSessionLimits?: boolean;
  sequentialDownload?: boolean;
  "peer-limit"?: number;
  queuePosition?: number;
  // Seed settings
  seedIdleLimit?: number;
  seedIdleMode?: number; // 0 = global, 1 = custom, 2 = unlimited
  seedRatioLimit?: number;
  seedRatioMode?: number; // 0 = global, 1 = custom, 2 = unlimited
  files?: Array<{
    name: string;
    length: number;
    bytesCompleted: number;
  }>;
  fileStats?: Array<{
    bytesCompleted: number;
    priority: number;
    wanted: boolean;
  }>;
  peers?: Array<{
    address: string;
    port: number;
    clientName: string;
    progress: number;
    rateToClient: number;
    rateToPeer: number;
    isEncrypted: boolean;
    isDownloadingFrom: boolean;
    isUploadingTo: boolean;
    flagStr: string;
  }>;
  trackers?: Array<{
    id: number;
    announce: string;
    scrape: string;
    sitename: string;
    tier: number;
  }>;
  peersFrom?: {
    fromCache: number;
    fromDht: number;
    fromIncoming: number;
    fromLpd: number;
    fromLtep: number;
    fromPex: number;
    fromTracker: number;
  };
}
