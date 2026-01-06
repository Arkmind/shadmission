import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatBytes, formatEta, formatSpeed, formatTime } from "@/lib/utils";
import { memo, type FC, type ReactNode } from "react";
import type { RawTorrentData, TorrentTabProps } from "./types";
import { formatDateString } from "./utils";

const parseLinks = (text: string): ReactNode => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0; // Reset regex state
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const DetailsTab: FC<TorrentTabProps> = memo(
  ({ torrent }) => {
    const raw = torrent.raw as RawTorrentData;

    const details = [
      { label: "Name", value: torrent.name },
      { label: "Hash", value: raw?.hashString || torrent.id, mono: true },
      { label: "Size", value: formatBytes(torrent.totalSize) },
      { label: "Downloaded", value: formatBytes(torrent.totalDownloaded) },
      { label: "Uploaded", value: formatBytes(torrent.totalUploaded) },
      { label: "Ratio", value: torrent.ratio.toFixed(3) },
      { label: "Progress", value: `${(torrent.progress * 100).toFixed(1)}%` },
      { label: "State", value: torrent.state },
      { label: "Save Path", value: torrent.savePath, mono: true },
      { label: "Added", value: formatDateString(torrent.dateAdded) },
      { label: "Completed", value: formatDateString(torrent.dateCompleted) },
      { label: "Download Speed", value: formatSpeed(torrent.downloadSpeed) },
      { label: "Upload Speed", value: formatSpeed(torrent.uploadSpeed) },
      { label: "ETA", value: formatEta(torrent.eta) },
      {
        label: "Seeds",
        value: `${torrent.connectedSeeds} / ${torrent.totalSeeds}`,
      },
      {
        label: "Peers",
        value: `${torrent.connectedPeers} / ${torrent.totalPeers}`,
      },
      {
        label: "Comment",
        value: raw?.comment ? parseLinks(raw.comment) : "N/A",
      },
      { label: "Creator", value: raw?.creator || "N/A" },
      { label: "Private", value: raw?.isPrivate ? "Yes" : "No" },
      {
        label: "Time Downloading",
        value: formatTime(raw?.secondsDownloading || 0),
      },
      { label: "Time Seeding", value: formatTime(raw?.secondsSeeding || 0) },
    ];

    return (
      <ScrollArea className="h-full pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((item, index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.label}
              </span>
              <span
                className={`text-sm ${
                  item.mono ? "font-mono text-xs break-all" : ""
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
        {raw?.errorMessage && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Error Message
              </span>
              <span className="text-sm text-red-600">{raw.errorMessage}</span>
            </div>
          </>
        )}
        {raw?.magnetLink && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Magnet Link
              </span>
              <code className="text-xs font-mono bg-muted p-2 rounded break-all select-all">
                {raw.magnetLink}
              </code>
            </div>
          </>
        )}
      </ScrollArea>
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.torrent;
    const next = nextProps.torrent;
    const prevRaw = prev.raw as RawTorrentData;
    const nextRaw = next.raw as RawTorrentData;
    return (
      prev.name === next.name &&
      prev.totalSize === next.totalSize &&
      prev.totalDownloaded === next.totalDownloaded &&
      prev.totalUploaded === next.totalUploaded &&
      prev.ratio === next.ratio &&
      prev.progress === next.progress &&
      prev.state === next.state &&
      prev.savePath === next.savePath &&
      prev.downloadSpeed === next.downloadSpeed &&
      prev.uploadSpeed === next.uploadSpeed &&
      prev.eta === next.eta &&
      prev.connectedSeeds === next.connectedSeeds &&
      prev.connectedPeers === next.connectedPeers &&
      prevRaw?.secondsDownloading === nextRaw?.secondsDownloading &&
      prevRaw?.secondsSeeding === nextRaw?.secondsSeeding
    );
  }
);

DetailsTab.displayName = "DetailsTab";
