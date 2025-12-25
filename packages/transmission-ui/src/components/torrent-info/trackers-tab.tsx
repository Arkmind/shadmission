import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/lib/transmission";
import { CheckIcon, EditIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import { memo, useEffect, useState, type FC } from "react";
import type { RawTorrentData, TorrentTabProps } from "./types";

interface TrackerEdit {
  id: number | null;
  announce: string;
}

export const TrackersTab: FC<TorrentTabProps> = memo(
  ({ torrent, onUpdate }) => {
    const raw = torrent.raw as RawTorrentData;
    const torrentId = raw?.id;

    const [trackers, setTrackers] = useState(raw?.trackers || []);
    const [newTrackerUrl, setNewTrackerUrl] = useState("");
    const [editingTracker, setEditingTracker] = useState<TrackerEdit | null>(
      null
    );

    // Update state when torrent changes
    useEffect(() => {
      setTrackers(raw?.trackers || []);
    }, [raw]);

    const handleAddTracker = async () => {
      if (!torrentId || !newTrackerUrl.trim()) return;
      try {
        await client.request("torrent-set", {
          ids: [torrentId],
          trackerAdd: [newTrackerUrl.trim()],
        });
        setNewTrackerUrl("");
        onUpdate?.();
      } catch (error) {
        console.error("Failed to add tracker:", error);
      }
    };

    const handleRemoveTracker = async (trackerId: number) => {
      if (!torrentId) return;
      try {
        await client.request("torrent-set", {
          ids: [torrentId],
          trackerRemove: [trackerId],
        });
        onUpdate?.();
      } catch (error) {
        console.error("Failed to remove tracker:", error);
      }
    };

    const handleEditTracker = async () => {
      if (!torrentId || !editingTracker || editingTracker.id === null) return;
      try {
        await client.request("torrent-set", {
          ids: [torrentId],
          trackerReplace: [editingTracker.id, editingTracker.announce],
        });
        setEditingTracker(null);
        onUpdate?.();
      } catch (error) {
        console.error("Failed to edit tracker:", error);
      }
    };

    return (
      <ScrollArea className="h-full">
        {/* Add Tracker */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="https://tracker.example.com/announce"
            value={newTrackerUrl}
            onChange={(e) => setNewTrackerUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTracker()}
          />
          <Button
            onClick={handleAddTracker}
            disabled={!newTrackerUrl.trim()}
            size="icon"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Tier</TableHead>
              <TableHead>Announce URL</TableHead>
              <TableHead className="w-32">Site</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trackers.map((tracker) => (
              <TableRow key={tracker.id}>
                <TableCell>
                  <Badge variant="outline">{tracker.tier}</Badge>
                </TableCell>
                <TableCell>
                  {editingTracker?.id === tracker.id ? (
                    <Input
                      value={editingTracker.announce}
                      onChange={(e) =>
                        setEditingTracker((t) =>
                          t ? { ...t, announce: e.target.value } : null
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEditTracker();
                        if (e.key === "Escape") setEditingTracker(null);
                      }}
                      autoFocus
                    />
                  ) : (
                    <span className="font-mono text-xs break-all">
                      {tracker.announce}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge>{tracker.sitename}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingTracker?.id === tracker.id ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={handleEditTracker}
                        >
                          <CheckIcon className="h-3 w-3 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingTracker(null)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setEditingTracker({
                              id: tracker.id,
                              announce: tracker.announce,
                            })
                          }
                        >
                          <EditIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleRemoveTracker(tracker.id)}
                        >
                          <Trash2Icon className="h-3 w-3 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {trackers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No trackers available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  },
  (prevProps, nextProps) => {
    const prevRaw = prevProps.torrent.raw as RawTorrentData;
    const nextRaw = nextProps.torrent.raw as RawTorrentData;
    return (
      JSON.stringify(prevRaw?.trackers) === JSON.stringify(nextRaw?.trackers) &&
      prevRaw?.id === nextRaw?.id
    );
  }
);

TrackersTab.displayName = "TrackersTab";
