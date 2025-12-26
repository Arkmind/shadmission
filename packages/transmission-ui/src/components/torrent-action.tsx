import {
  fetchAllLabels,
  fetchTorrentLabels,
  reannounceTorrents,
  removeTorrents,
  setTorrentsLabels,
  setTorrentsPriority,
  startTorrents,
  startTorrentsNow,
  stopTorrents,
  verifyTorrents,
} from "@/lib/torrent-actions";
import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import {
  CheckCircle,
  ChevronDown,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface RawTorrentData {
  id: number;
  labels?: string[];
  bandwidthPriority?: number;
}

export interface TorrentActionProps {
  /** Single torrent or array of torrents to act on */
  torrents: NormalizedTorrent | NormalizedTorrent[];
  /** Callback after any action completes */
  onUpdate?: () => void;
  /** Render as inline button (for bulk actions) vs icon button (for single row) */
  variant?: "icon" | "button";
  /** Custom trigger element */
  trigger?: React.ReactNode;
}

export const TorrentAction: FC<TorrentActionProps> = ({
  torrents: torrentsProp,
  onUpdate,
  variant = "icon",
  trigger,
}) => {
  // Normalize to array
  const torrents = Array.isArray(torrentsProp) ? torrentsProp : [torrentsProp];
  const isBulk = torrents.length > 1;
  const singleTorrent = torrents.length === 1 ? torrents[0] : null;

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

  // Get current priority (only meaningful for single torrent)
  const raw = singleTorrent?.raw as RawTorrentData | undefined;
  const currentPriority = raw?.bandwidthPriority ?? 0;

  const handleStart = async () => {
    setLoadingAction("start");
    await startTorrents(torrents, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const handleStartNow = async () => {
    setLoadingAction("startNow");
    await startTorrentsNow(torrents, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const handleStop = async () => {
    setLoadingAction("stop");
    await stopTorrents(torrents, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const handleRemove = async () => {
    setIsLoading(true);
    const success = await removeTorrents(torrents, deleteData, onUpdate);
    setIsLoading(false);
    if (success) {
      setRemoveDialogOpen(false);
    }
    setIsOpen(false);
  };

  const handleVerify = async () => {
    setLoadingAction("verify");
    await verifyTorrents(torrents, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const handleReannounce = async () => {
    setLoadingAction("reannounce");
    await reannounceTorrents(torrents, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const handlePriorityChange = async (priority: number) => {
    setLoadingAction(`priority-${priority}`);
    await setTorrentsPriority(torrents, priority, onUpdate);
    setLoadingAction(null);
    setIsOpen(false);
  };

  const openLabelsDialog = async () => {
    setLabelsDialogOpen(true);
    setIsOpen(false);

    // Fetch labels
    if (singleTorrent) {
      const labels = await fetchTorrentLabels(singleTorrent);
      setCurrentLabels(labels);
    } else {
      // For bulk, start with empty labels
      setCurrentLabels([]);
    }

    const all = await fetchAllLabels();
    setAllLabels(all);
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
    setIsLoading(true);
    const success = await setTorrentsLabels(torrents, currentLabels, onUpdate);
    setIsLoading(false);
    if (success) {
      setLabelsDialogOpen(false);
    }
  };

  const getDisplayName = () => {
    if (isBulk) {
      return `${torrents.length} torrent(s)`;
    }
    return singleTorrent?.name || "torrent";
  };

  const renderTrigger = () => {
    if (trigger) return trigger;

    if (variant === "button") {
      return (
        <Button variant="default" size="sm" className="h-8">
          Actions
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      );
    }

    return (
      <Button size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
        <Ellipsis />
      </Button>
    );
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>{renderTrigger()}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {isBulk && (
            <>
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          )}

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

          {/* Labels only for single torrent - bulk label management is complex */}
          {!isBulk && (
            <>
              <DropdownMenuItem onClick={openLabelsDialog}>
                <Tags className="mr-2 h-4 w-4" />
                Change labels
              </DropdownMenuItem>

              <DropdownMenuSeparator />
            </>
          )}

          {/* Priority submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {!isBulk && (
                <>
                  Priority:{" "}
                  {currentPriority === -1
                    ? "Low"
                    : currentPriority === 1
                    ? "High"
                    : "Normal"}
                </>
              )}
              {isBulk && "Set Priority"}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(-1)}
                disabled={loadingAction === "priority--1"}
              >
                {loadingAction === "priority--1" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isBulk && currentPriority === -1 && "✓ "}Low
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(0)}
                disabled={loadingAction === "priority-0"}
              >
                {loadingAction === "priority-0" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isBulk && currentPriority === 0 && "✓ "}Normal
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handlePriorityChange(1)}
                disabled={loadingAction === "priority-1"}
              >
                {loadingAction === "priority-1" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isBulk && currentPriority === 1 && "✓ "}High
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              Remove {isBulk ? `${torrents.length} Torrent(s)` : "Torrent"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {getDisplayName()}?
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
              {isBulk
                ? `Set labels for ${torrents.length} selected torrent(s)`
                : `Add, remove, or create labels for "${singleTorrent?.name}"`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current labels */}
            <div className="space-y-2">
              <Label>{isBulk ? "Labels to Set" : "Current Labels"}</Label>
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
                    No labels {isBulk ? "selected" : "assigned"}
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
