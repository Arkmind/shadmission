import { TorrentState } from "@ctrl/shared-torrent";
import { Transmission } from "@ctrl/transmission";

export const client = new Transmission({
  baseUrl: process.env.TRANSMISSION_HOST ?? "http://localhost:9091",
  username: process.env.TRANSMISSION_USERNAME ?? "arky",
  password: process.env.TRANSMISSION_PASSWORD ?? "arky",
});

export const retrieveTorrentsTransfer = async () => {
  const data = await client.getAllData();

  return data.torrents
    .filter(
      (t) =>
        t.state === TorrentState.downloading || t.state === TorrentState.seeding
    )
    .map((torrent) => ({
      torrent: torrent.name,
      torrent_id: torrent.id,
      upload: torrent.uploadSpeed,
      download: torrent.downloadSpeed,
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
    return {
      upload: null,
      download: null,
      timestamp: Date.now(),
      details: [],
    };
  }
};

export default client;
