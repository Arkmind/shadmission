import { Graph } from "@/components/graph";
import { LiveTransfer } from "@/components/live-transfer";
import { TorrentList } from "@/components/torrent-list";
import { Card, CardContent } from "@/components/ui/card";
import { useSnapshots } from "@/hooks/use-snapshots";
import { cn } from "@/lib/utils";
import type React from "react";
import { useState } from "react";

export const Dashboard: React.FC = () => {
  const [torrent, setTorrent] = useState<string | null>(null);
  const snapshots = useSnapshots({ initialSeconds: 300 });

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full">
      {/* Graph */}
      <Card className="rounded-xl col-span-1 row-span-2 py-4 px-0">
        <CardContent className="h-full flex flex-col space-y-4 px-1">
          <LiveTransfer
            data={snapshots.data}
            isConnected={snapshots.isConnected}
          />
          <Graph snapshots={snapshots} />
        </CardContent>
      </Card>
      {/* Filters */}
      <Card className="rounded-xl col-span-1 row-span-3 row-start-3"></Card>

      {/* Torrent list */}
      <Card
        className={cn(
          "rounded-xl col-span-3 py-0",
          torrent ? "row-span-3" : "row-span-full"
        )}
      >
        <TorrentList />
      </Card>
      {/* Data from selected torrent */}
      {torrent && <Card className="rounded-xl col-span-3 row-span-2"></Card>}
    </div>
  );
};
