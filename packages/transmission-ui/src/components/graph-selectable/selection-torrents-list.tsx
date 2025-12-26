import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatBytes, formatSpeed } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { useState, type FC } from "react";
import { useGraphSelectable } from "./context";
import type { AggregatedPeer, AggregatedTorrent } from "./types";

export const SelectionTorrentsList: FC = () => {
  const { aggregatedData } = useGraphSelectable();
  const [expandedTorrent, setExpandedTorrent] = useState<number | null>(null);

  if (!aggregatedData || aggregatedData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground select-none">
        No active torrents in this time range
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="divide-y">
        {aggregatedData.map((torrent) => (
          <TorrentRow
            key={torrent.torrent_id}
            torrent={torrent}
            isExpanded={expandedTorrent === torrent.torrent_id}
            onToggle={() =>
              setExpandedTorrent(
                expandedTorrent === torrent.torrent_id
                  ? null
                  : torrent.torrent_id
              )
            }
          />
        ))}
      </div>
    </ScrollArea>
  );
};

interface TorrentRowProps {
  torrent: AggregatedTorrent;
  isExpanded: boolean;
  onToggle: () => void;
}

const TorrentRow: FC<TorrentRowProps> = ({ torrent, isExpanded, onToggle }) => {
  const peers = Array.from(torrent.peers.values()).sort(
    (a, b) =>
      b.avgDownloadSpeed +
      b.avgUploadSpeed -
      (a.avgDownloadSpeed + a.avgUploadSpeed)
  );

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <ChevronRight
              className={cn(
                "transition-transform text-muted-foreground size-4",
                isExpanded && "rotate-90"
              )}
            />
            <span className="truncate font-medium">{torrent.torrent}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {torrent.peers.size} peer{torrent.peers.size !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex gap-4 text-sm shrink-0">
            <span
              className="text-muted-foreground"
              title={`Avg: ${formatSpeed(torrent.avgDownload)}`}
            >
              ↓ {formatBytes(torrent.totalDownload)}
            </span>
            <span
              className="text-muted-foreground"
              title={`Avg: ${formatSpeed(torrent.avgUpload)}`}
            >
              ↑ {formatBytes(torrent.totalUpload)}
            </span>
          </div>
        </div>
      </button>

      {isExpanded && peers.length > 0 && (
        <div className="bg-muted/20 border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left p-2 pl-10 font-normal">IP</th>
                <th className="text-left p-2 font-normal">Client</th>
                <th className="text-left p-2 font-normal">Country</th>
                <th className="text-right p-2 font-normal">Download</th>
                <th className="text-right p-2 font-normal">Upload</th>
                <th className="text-center p-2 font-normal">Seeder</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer) => (
                <PeerRow key={`${peer.ip}:${peer.port}`} peer={peer} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface PeerRowProps {
  peer: AggregatedPeer;
}

const PeerRow: FC<PeerRowProps> = ({ peer }) => {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/30">
      <td className="p-2 pl-10 font-mono text-xs">
        {peer.ip}:{peer.port}
      </td>
      <td className="p-2 truncate max-w-48" title={peer.client}>
        {peer.client || "Unknown"}
      </td>
      <td className="p-2">{peer.country || "—"}</td>
      <td
        className="p-2 text-right"
        title={`Avg: ${formatSpeed(peer.avgDownloadSpeed)}`}
      >
        {formatBytes(peer.totalDownloadSpeed)}
      </td>
      <td
        className="p-2 text-right"
        title={`Avg: ${formatSpeed(peer.avgUploadSpeed)}`}
      >
        {formatBytes(peer.totalUploadSpeed)}
      </td>
      <td className="p-2 text-center">{peer.isSeeder ? "✓" : "—"}</td>
    </tr>
  );
};
