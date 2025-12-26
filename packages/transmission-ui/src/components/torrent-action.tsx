import { client } from "@/lib/transmission";
import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import {
  CheckCircle,
  Ellipsis,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Square,
  Tags,
  Trash2,
  X,
} from "lucide-react";
import { type FC, useState } from "react";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export interface TorrentActionProps {
  torrent: NormalizedTorrent;
  onUpdate?: () => void;
}

interface RawTorrentData {
  id: number;
  labels?: string[];
  bandwidthPriority?: number;
}

export const TorrentAction: FC<TorrentActionProps> = ({
  torrent,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [labelsDialogOpen, setLabelsDialogOpen] = useState(false);
  const [deleteData, setDeleteData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Labels state
  const [currentLabels, setCurrentLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [allLabels, setAllLabels] = useState<string[]>([]);

  const raw = torrent.raw as RawTorrentData | undefined;
  const torrentId = raw?.id;

  const handleStart = async () => {
    if (!torrentId) return;
    setLoadingAction("start");
    try {
      await client.resumeTorrent(torrentId);
      toast.success("Torrent started", {
        description: `${torrent.name} has been started.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to start torrent:", error);
      toast.error("Failed to start torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const handleStartNow = async () => {
    if (!torrentId) return;
    setLoadingAction("startNow");
    try {
      // Start now bypasses the queue
      await client.request("torrent-start-now", { ids: [torrentId] });
      toast.success("Torrent started immediately", {
        description: `${torrent.name} has been started (bypassing queue).`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to start torrent now:", error);
      toast.error("Failed to start torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const handleStop = async () => {
    if (!torrentId) return;
    setLoadingAction("stop");
    try {
      await client.pauseTorrent(torrentId);
      toast.success("Torrent stopped", {
        description: `${torrent.name} has been stopped.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to stop torrent:", error);
      toast.error("Failed to stop torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const handleRemove = async () => {
    if (!torrentId) return;
    setIsLoading(true);
    try {
      await client.removeTorrent(torrentId, deleteData);
      toast.success("Torrent removed", {
        description: deleteData
          ? `${torrent.name} and its data have been deleted.`
          : `${torrent.name} has been removed (data kept).`,
      });
      onUpdate?.();
      setRemoveDialogOpen(false);
    } catch (error) {
      console.error("Failed to remove torrent:", error);
      toast.error("Failed to remove torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleVerify = async () => {
    if (!torrentId) return;
    setLoadingAction("verify");
    try {
      await client.verifyTorrent(torrentId);
      toast.success("Verification started", {
        description: `${torrent.name} is being verified.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to verify torrent:", error);
      toast.error("Failed to verify torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const handleReannounce = async () => {
    if (!torrentId) return;
    setLoadingAction("reannounce");
    try {
      await client.reannounceTorrent(torrentId);
      toast.success("Tracker reannounced", {
        description: `Asked tracker for more peers for ${torrent.name}.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to reannounce torrent:", error);
      toast.error("Failed to reannounce", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const handlePriorityChange = async (priority: number) => {
    if (!torrentId) return;
    setLoadingAction(`priority-${priority}`);
    try {
      await client.setTorrent(torrentId, { bandwidthPriority: priority });
      const priorityNames = { [-1]: "Low", 0: "Normal", 1: "High" };
      toast.success("Priority changed", {
        description: `${torrent.name} priority set to ${
          priorityNames[priority as keyof typeof priorityNames]
        }.`,
      });
      onUpdate?.();
    } catch (error) {
      console.error("Failed to change priority:", error);
      toast.error("Failed to change priority", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setLoadingAction(null);
      setIsOpen(false);
    }
  };

  const openLabelsDialog = async () => {
    if (!torrentId) return;
    setLabelsDialogOpen(true);
    setIsOpen(false);

    try {
      // Get current torrent labels
      const result = await client.listTorrents(torrentId, ["labels"]);
      const torrentData = result.arguments.torrents[0] as
        | { labels?: string[] }
        | undefined;
      setCurrentLabels(torrentData?.labels || []);

      // Get all labels from all torrents
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
      setAllLabels(Array.from(labelsSet).sort());
    } catch (error) {
      console.error("Failed to fetch labels:", error);
      toast.error("Failed to fetch labels", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const handleAddLabel = () => {
    const trimmed = newLabel.trim();
    if (trimmed && !currentLabels.includes(trimmed)) {
      setCurrentLabels([...currentLabels, trimmed]);
      if (!allLabels.includes(trimmed)) {
        setAllLabels([...allLabels, trimmed].sort());
      }
    }
    setNewLabel("");
  };

  const handleRemoveLabel = (label: string) => {
    setCurrentLabels(currentLabels.filter((l) => l !== label));
  };

  const handleToggleExistingLabel = (label: string) => {
    if (currentLabels.includes(label)) {
      setCurrentLabels(currentLabels.filter((l) => l !== label));
    } else {
      setCurrentLabels([...currentLabels, label]);
    }
  };

  const handleSaveLabels = async () => {
    if (!torrentId) return;
    setIsLoading(true);
    try {
      await client.setTorrent(torrentId, { labels: currentLabels });
      toast.success("Labels updated", {
        description:
          currentLabels.length > 0
            ? `Labels set to: ${currentLabels.join(", ")}`
            : "All labels removed.",
      });
      onUpdate?.();
      setLabelsDialogOpen(false);
    } catch (error) {
      console.error("Failed to update labels:", error);
      toast.error("Failed to update labels", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentPriority = raw?.bandwidthPriority ?? 0;

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {/* Start submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              disabled={loadingAction?.startsWith("start")}
            >
              {loadingAction?.startsWith("start") ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={handleStart}
                disabled={loadingAction === "start"}
              >
                {loadingAction === "start" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleStartNow}
                disabled={loadingAction === "startNow"}
              >
                {loadingAction === "startNow" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Start Now (bypass queue)
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onClick={handleStop}
            disabled={loadingAction === "stop"}
          >
            {loadingAction === "stop" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Square className="mr-2 h-4 w-4" />
            )}
            Stop
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setRemoveDialogOpen(true);
              setDeleteData(false);
              setIsOpen(false);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleVerify}
            disabled={loadingAction === "verify"}
          >
            {loadingAction === "verify" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Verify local data
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleReannounce}
            disabled={loadingAction === "reannounce"}
          >
            {loadingAction === "reannounce" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Ask tracker for more peers
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={openLabelsDialog}>
            <Tags className="mr-2 h-4 w-4" />
            Change labels
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Priority submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              Priority:{" "}
              {currentPriority === -1
                ? "Low"
                : currentPriority === 1
                ? "High"
                : "Normal"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(-1)}
                disabled={loadingAction === "priority--1"}
              >
                {loadingAction === "priority--1" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {currentPriority === -1 && "✓ "}Low
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(0)}
                disabled={loadingAction === "priority-0"}
              >
                {loadingAction === "priority-0" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {currentPriority === 0 && "✓ "}Normal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(1)}
                disabled={loadingAction === "priority-1"}
              >
                {loadingAction === "priority-1" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {currentPriority === 1 && "✓ "}High
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Remove Torrent</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{torrent.name}"?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="deleteData"
              checked={deleteData}
              onCheckedChange={(checked) => setDeleteData(checked === true)}
            />
            <Label
              htmlFor="deleteData"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Also delete downloaded data
            </Label>
          </div>

          {deleteData && (
            <p className="text-sm text-destructive">
              Warning: This will permanently delete the downloaded files from
              your disk.
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove{deleteData ? " & Delete Data" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labels Dialog */}
      <Dialog open={labelsDialogOpen} onOpenChange={setLabelsDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Manage Labels</DialogTitle>
            <DialogDescription>
              Add, remove, or create labels for "{torrent.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current labels */}
            <div className="space-y-2">
              <Label>Current Labels</Label>
              <div className="flex flex-wrap gap-2 min-h-8">
                {currentLabels.length > 0 ? (
                  currentLabels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {label}
                      <button
                        onClick={() => handleRemoveLabel(label)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No labels assigned
                  </span>
                )}
              </div>
            </div>

            {/* Add new label */}
            <div className="space-y-2">
              <Label htmlFor="newLabel">Create New Label</Label>
              <div className="flex gap-2">
                <Input
                  id="newLabel"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Enter label name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLabel();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleAddLabel}
                  disabled={!newLabel.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Existing labels from all torrents */}
            {allLabels.length > 0 && (
              <div className="space-y-2">
                <Label>Available Labels</Label>
                <div className="flex flex-wrap gap-2">
                  {allLabels.map((label) => (
                    <Badge
                      key={label}
                      variant={
                        currentLabels.includes(label) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => handleToggleExistingLabel(label)}
                    >
                      {currentLabels.includes(label) && "✓ "}
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLabelsDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveLabels} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Labels"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
