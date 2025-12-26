import { client } from "@/lib/transmission";
import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import { toast } from "sonner";

interface RawTorrentData {
  id: number;
  labels?: string[];
  bandwidthPriority?: number;
}

// Extract IDs from torrents
export const getTorrentIds = (torrents: NormalizedTorrent[]): number[] => {
  return torrents
    .map((t) => (t.raw as RawTorrentData | undefined)?.id)
    .filter((id): id is number => id !== undefined);
};

// Get display name for toast messages
const getDisplayName = (torrents: NormalizedTorrent[]): string => {
  if (torrents.length === 1) {
    return torrents[0].name;
  }
  return `${torrents.length} torrent(s)`;
};

// Start torrents
export const startTorrents = async (
  torrents: NormalizedTorrent[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-start", { ids });
    toast.success(`Started ${getDisplayName(torrents)}`);
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to start torrents:", error);
    toast.error("Failed to start torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Start torrents immediately (bypass queue)
export const startTorrentsNow = async (
  torrents: NormalizedTorrent[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-start-now", { ids });
    toast.success(`Started ${getDisplayName(torrents)} immediately`, {
      description: "Bypassing queue",
    });
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to start torrents:", error);
    toast.error("Failed to start torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Stop torrents
export const stopTorrents = async (
  torrents: NormalizedTorrent[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-stop", { ids });
    toast.success(`Stopped ${getDisplayName(torrents)}`);
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to stop torrents:", error);
    toast.error("Failed to stop torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Remove torrents
export const removeTorrents = async (
  torrents: NormalizedTorrent[],
  deleteData: boolean,
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-remove", {
      ids,
      "delete-local-data": deleteData,
    });
    toast.success(
      deleteData
        ? `Removed ${getDisplayName(torrents)} and deleted data`
        : `Removed ${getDisplayName(torrents)}`
    );
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to remove torrents:", error);
    toast.error("Failed to remove torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Verify torrents
export const verifyTorrents = async (
  torrents: NormalizedTorrent[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-verify", { ids });
    toast.success(`Started verification for ${getDisplayName(torrents)}`);
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to verify torrents:", error);
    toast.error("Failed to verify torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Reannounce torrents
export const reannounceTorrents = async (
  torrents: NormalizedTorrent[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-reannounce", { ids });
    toast.success(`Reannounced ${getDisplayName(torrents)}`);
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to reannounce torrents:", error);
    toast.error("Failed to reannounce torrent(s)", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Set priority for torrents
export const setTorrentsPriority = async (
  torrents: NormalizedTorrent[],
  priority: number,
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-set", {
      ids,
      bandwidthPriority: priority,
    });
    const priorityNames = { [-1]: "Low", 0: "Normal", 1: "High" };
    toast.success(
      `Set priority to ${
        priorityNames[priority as keyof typeof priorityNames]
      } for ${getDisplayName(torrents)}`
    );
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to change priority:", error);
    toast.error("Failed to change priority", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Set labels for torrents
export const setTorrentsLabels = async (
  torrents: NormalizedTorrent[],
  labels: string[],
  onUpdate?: () => void
): Promise<boolean> => {
  const ids = getTorrentIds(torrents);
  if (ids.length === 0) return false;

  try {
    await client.request("torrent-set", { ids, labels });
    toast.success("Labels updated", {
      description:
        labels.length > 0
          ? `Labels set to: ${labels.join(", ")}`
          : "All labels removed.",
    });
    onUpdate?.();
    return true;
  } catch (error) {
    console.error("Failed to update labels:", error);
    toast.error("Failed to update labels", {
      description:
        error instanceof Error ? error.message : "An unknown error occurred",
    });
    return false;
  }
};

// Fetch all available labels from all torrents
export const fetchAllLabels = async (): Promise<string[]> => {
  try {
    const allTorrents = await client.listTorrents(undefined, ["labels"]);
    const labelsSet = new Set<string>();
    for (const t of allTorrents.arguments.torrents) {
      const tData = t as { labels?: string[] };
      if (tData.labels) {
        for (const label of tData.labels) {
          labelsSet.add(label);
        }
      }
    }
    return Array.from(labelsSet).sort();
  } catch (error) {
    console.error("Failed to fetch labels:", error);
    return [];
  }
};

// Fetch current labels for a torrent
export const fetchTorrentLabels = async (
  torrent: NormalizedTorrent
): Promise<string[]> => {
  const ids = getTorrentIds([torrent]);
  if (ids.length === 0) return [];

  try {
    const result = await client.listTorrents(ids[0], ["labels"]);
    const torrentData = result.arguments.torrents[0] as
      | { labels?: string[] }
      | undefined;
    return torrentData?.labels || [];
  } catch (error) {
    console.error("Failed to fetch torrent labels:", error);
    return [];
  }
};
