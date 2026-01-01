import { TorrentState } from "@ctrl/shared-torrent";
import { Transmission } from "@ctrl/transmission";
import geoip from "geoip-lite";

export const client = new Transmission({
  baseUrl: process.env.TRANSMISSION_URL ?? "http://localhost:9091",
  username: process.env.TRANSMISSION_USER ?? "arky",
  password: process.env.TRANSMISSION_PASS ?? "arky",
});

export interface PeerInfo {
  ip: string;
  port: number;
  country: string | null;
  client: string;
  downloadSpeed: number; // bytes/s we're downloading from this peer
  uploadSpeed: number; // bytes/s we're uploading to this peer
  isSeeder: boolean; // true if peer has 100% of the torrent
  isDownloading: boolean; // true if we're downloading from them
  isUploading: boolean; // true if we're uploading to them
}

export interface TorrentTransfer {
  torrent: string;
  torrent_id: number;
  upload: number;
  download: number;
  peers: PeerInfo[];
}

export const retrieveTorrentsTransfer = async (): Promise<
  TorrentTransfer[]
> => {
  const data = await client.getAllData();

  return data.torrents
    .filter(
      (t) =>
        t.state === TorrentState.downloading || t.state === TorrentState.seeding
    )
    .map((torrent) => ({
      torrent: torrent.name,
      torrent_id: torrent.raw?.id ?? 0,
      upload: torrent.uploadSpeed,
      download: torrent.downloadSpeed,
      peers: (torrent.raw?.peers ?? []).map(
        (peer: {
          address: string;
          port: number;
          clientName: string;
          rateToClient: number;
          rateToPeer: number;
          progress: number;
          isDownloadingFrom: boolean;
          isUploadingTo: boolean;
        }) => {
          const geo = geoip.lookup(peer.address);
          return {
            ip: peer.address,
            port: peer.port,
            country: geo?.country ?? null,
            client: peer.clientName,
            downloadSpeed: peer.rateToClient,
            uploadSpeed: peer.rateToPeer,
            isSeeder: peer.progress === 1,
            isDownloading: peer.isDownloadingFrom,
            isUploading: peer.isUploadingTo,
          };
        }
      ),
    }));
};

export const getTransferSnapshot = async () => {
  try {
    const torrents = await retrieveTorrentsTransfer();

    return {
      upload: torrents.reduce((acc, curr) => acc + curr.upload, 0),
      download: torrents.reduce((acc, curr) => acc + curr.download, 0),
      timestamp: Date.now(),
      details: torrents,
    };
  } catch (error) {
    console.error("Error retrieving torrent transfer data:", error);

    return {
      upload: null,
      download: null,
      timestamp: Date.now(),
      details: [],
    };
  }
};

export default client;
