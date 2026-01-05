import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Download,
  Pause,
  Upload,
  Users,
} from "lucide-react";
import { type FC, useMemo } from "react";

interface ActivityStats {
  downloading: number;
  seeding: number;
  paused: number;
  checking: number;
  queued: number;
  error: number;
  totalPeers: number;
  activePeers: number;
}

interface ErrorTorrent {
  id: string | number;
  name: string;
  errorString: string;
}

interface SessionStatusProps {
  torrents?: NormalizedTorrent[];
}

export const SessionStatus: FC<SessionStatusProps> = ({ torrents = [] }) => {
  // Calculate activity stats from torrents
  const activity = useMemo<ActivityStats>(() => {
    const stats: ActivityStats = {
      downloading: 0,
      seeding: 0,
      paused: 0,
      checking: 0,
      queued: 0,
      error: 0,
      totalPeers: 0,
      activePeers: 0,
    };

    for (const t of torrents) {
      switch (t.state) {
        case "downloading":
          stats.downloading++;
          break;
        case "seeding":
          stats.seeding++;
          break;
        case "paused":
          stats.paused++;
          break;
        case "checking":
          stats.checking++;
          break;
        case "queued":
          stats.queued++;
          break;
        case "error":
          stats.error++;
          break;
      }
      stats.totalPeers += t.connectedPeers || 0;
      if (t.downloadSpeed > 0 || t.uploadSpeed > 0) {
        stats.activePeers += t.connectedPeers || 0;
      }
    }

    return stats;
  }, [torrents]);

  // Get torrents with errors
  const errorTorrents = useMemo<ErrorTorrent[]>(() => {
    return torrents
      .filter((t) => t.state === "error" || t.raw.error !== 0)
      .map((t) => ({
        id: t.id,
        name: t.name,
        errorString: t.raw.errorString || "Unknown error",
      }));
  }, [torrents]);

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Status</span>
      </div>

      {/* Activity Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Activity
        </h3>
        <div className="grid grid-cols-2 gap-1.5 text-sm">
          {/* Downloading */}
          <div className="flex items-center gap-2">
            <Download className="w-3.5 h-3.5 text-green-500" />
            <span className="text-muted-foreground">Downloading</span>
          </div>
          <span className="text-right font-medium">{activity.downloading}</span>

          {/* Seeding */}
          <div className="flex items-center gap-2">
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">Seeding</span>
          </div>
          <span className="text-right font-medium">{activity.seeding}</span>

          {/* Paused */}
          <div className="flex items-center gap-2">
            <Pause className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-muted-foreground">Paused</span>
          </div>
          <span className="text-right font-medium">{activity.paused}</span>

          {/* Queued */}
          {activity.queued > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Queued</span>
              </div>
              <span className="text-right font-medium">{activity.queued}</span>
            </>
          )}

          {/* Peers */}
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Peers</span>
          </div>
          <span className="text-right font-medium">
            {activity.activePeers}/{activity.totalPeers}
          </span>
        </div>
      </div>

      <Separator />

      {/* Errors Section */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden -mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Errors
          </h3>
          {errorTorrents.length > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              {errorTorrents.length}
            </Badge>
          )}
        </div>

        {errorTorrents.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pb-3">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            <span>No errors</span>
          </div>
        ) : (
          <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0">
              <ScrollArea className="h-full [&_[data-radix-scroll-area-viewport]>:first-child]:block!">
                <div className="space-y-2 pr-3 pb-3">
                  {errorTorrents.map((t) => (
                    <div
                      key={t.id}
                      className={cn(
                        "p-2 rounded-md text-xs",
                        "bg-destructive/10 border border-destructive/20"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                        <div className="min-w-0 space-y-1">
                          <p className="font-medium truncate" title={t.name}>
                            {t.name}
                          </p>
                          <p className="text-destructive/80 wrap-break-word">
                            {t.errorString}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
