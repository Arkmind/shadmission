import type { TorrentDetail } from "@/lib/monitor";
import { formatSpeed } from "@/lib/utils";
import type { FC } from "react";
import { ScrollArea } from "./ui/scroll-area";

interface GraphTooltipData {
  timestamp: number;
  upload: number;
  download: number;
  details?: TorrentDetail[];
}

interface GraphTooltipProps {
  active?: boolean;
  payload?: { payload: GraphTooltipData }[];
}

export const GraphTooltip: FC<GraphTooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const timestamp = new Date(data.timestamp);
  const details = data.details ?? [];

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-48">
      <div className="text-sm font-medium mb-2">
        {isNaN(timestamp.getTime())
          ? "Invalid time"
          : timestamp.toLocaleTimeString(navigator.language, {
              hour: "numeric",
              minute: "numeric",
              second: "numeric",
              day: "numeric",
              month: "short",
            })}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-download)" }}
        />
        <span className="text-muted-foreground">Download:</span>
        <span className="font-medium">{formatSpeed(data.download)}</span>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--color-upload)" }}
        />
        <span className="text-muted-foreground">Upload:</span>
        <span className="font-medium">{formatSpeed(data.upload)}</span>
      </div>

      {details.filter((t) => t.download > 0 || t.upload > 0).length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs text-muted-foreground mb-1">
            Active torrents:
          </div>
          <ScrollArea className="max-h-32">
            <div className="space-y-1 h-full">
              {details
                .filter((t) => t.download > 0 || t.upload > 0)
                .map((torrent) => (
                  <div
                    key={torrent.torrent_id}
                    className="text-xs flex justify-between gap-2"
                  >
                    <span className="truncate max-w-32" title={torrent.torrent}>
                      {torrent.torrent}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      ↓{formatSpeed(torrent.download)} ↑
                      {formatSpeed(torrent.upload)}
                    </span>
                  </div>
                ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
