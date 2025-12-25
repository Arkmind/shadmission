import { Graph } from "@/components/graph";
import { LiveTransfer } from "@/components/live-transfer";
import { TorrentList } from "@/components/torrent-list";
import { Card, CardContent } from "@/components/ui/card";
import data from "@/data/torrent-data.json";
import { cn } from "@/lib/utils";
import type React from "react";
import { useState } from "react";

interface Torrent {
  id: number;
  name: string;
  percentDone: number;
  eta: number;
  rateDownload: number;
  rateUpload: number;
  totalSize: number;
  downloadedEver: number;
  uploadedEver: number;
  addedDate: number;
  uploadRatio: number;
}

export const Dashboard: React.FC = () => {
  const [torrent, setTorrent] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full">
      {/* Graph */}
      <Card className="rounded-xl col-span-1 row-span-2 py-4 px-0">
        <CardContent className="h-full flex flex-col space-y-4 px-1">
          <LiveTransfer />
          <Graph
            data={data.map((e) => ({
              date: new Date(e.timestamp).toISOString(),
              upload: e.upload,
              download: e.download,
            }))}
          />
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
