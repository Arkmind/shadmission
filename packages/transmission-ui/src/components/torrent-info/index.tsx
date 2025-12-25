import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import {
  FileIcon,
  InfoIcon,
  ServerIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { type FC } from "react";
import { ActionsTab } from "./actions-tab";
import { DetailsTab } from "./details-tab";
import { FilesTab } from "./files-tab";
import { PeersTab } from "./peers-tab";
import { TrackersTab } from "./trackers-tab";
import type { RawTorrentData } from "./types";

export interface TorrentInfoProps {
  torrent: NormalizedTorrent;
  onUpdate?: () => void;
}

export const TorrentInfo: FC<TorrentInfoProps> = ({ torrent, onUpdate }) => {
  const raw = torrent.raw as RawTorrentData;
  const peersCount = raw?.peers?.length || 0;
  const filesCount = raw?.files?.length || 0;
  const trackersCount = raw?.trackers?.length || 0;

  return (
    <div className="w-full h-full">
      <Tabs defaultValue="details" className="w-full h-full">
        <TabsList className="w-full pb-1">
          <TabsTrigger value="details">
            <InfoIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Files</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {filesCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="peers">
            <UsersIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Peers</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {peersCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="trackers">
            <ServerIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Trackers</span>
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {trackersCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="actions">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="py-2 px-4 h-[calc(100%-68px)]">
          <DetailsTab torrent={torrent} />
        </TabsContent>

        <TabsContent value="files" className="py-2 px-4 h-[calc(100%-68px)]">
          <FilesTab torrent={torrent} />
        </TabsContent>

        <TabsContent
          value="peers"
          className="py-2 px-4 max-h-[calc(100%-68px)]"
        >
          <PeersTab torrent={torrent} />
        </TabsContent>

        <TabsContent
          value="trackers"
          className="py-2 px-4 max-h-[calc(100%-68px)]"
        >
          <TrackersTab torrent={torrent} onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="actions" className="py-2 px-4 h-[calc(100%-68px)]">
          <ActionsTab torrent={torrent} onUpdate={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Re-export utilities for external use
export { getStateColor } from "./utils";
