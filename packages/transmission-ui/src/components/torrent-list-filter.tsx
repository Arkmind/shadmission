import type { NormalizedTorrent } from "@ctrl/shared-torrent";
import { ChevronDown, Filter, Search, Tags, X } from "lucide-react";
import { type FC } from "react";
import { TorrentAction } from "./torrent-action";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

// Types for filter states
export type TorrentStateFilter =
  | "all"
  | "downloading"
  | "seeding"
  | "paused"
  | "checking"
  | "error"
  | "queued";

export type PriorityFilter = "all" | "high" | "normal" | "low";

export interface TorrentFilters {
  search: string;
  state: TorrentStateFilter;
  priority: PriorityFilter;
  labels: string[];
  trackers: string[];
}

export interface TorrentListFilterProps {
  selectedTorrents: NormalizedTorrent[];
  availableLabels: string[];
  availableTrackers: string[];
  filters: TorrentFilters;
  onFiltersChange: (filters: TorrentFilters) => void;
  onUpdate?: () => void;
}

interface RawTorrentData {
  id: number;
  labels?: string[];
  bandwidthPriority?: number;
}

const STATE_OPTIONS: { value: TorrentStateFilter; label: string }[] = [
  { value: "all", label: "All States" },
  { value: "downloading", label: "Downloading" },
  { value: "seeding", label: "Seeding" },
  { value: "paused", label: "Paused" },
  { value: "checking", label: "Checking" },
  { value: "queued", label: "Queued" },
  { value: "error", label: "Error" },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All Priorities" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

export const TorrentListFilter: FC<TorrentListFilterProps> = ({
  selectedTorrents,
  availableLabels,
  availableTrackers,
  filters,
  onFiltersChange,
  onUpdate,
}) => {
  const hasSelection = selectedTorrents.length > 0;
  const selectionCount = selectedTorrents.length;

  // Filter handlers
  const updateFilter = <K extends keyof TorrentFilters>(
    key: K,
    value: TorrentFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleLabelFilter = (label: string) => {
    const newLabels = filters.labels.includes(label)
      ? filters.labels.filter((l) => l !== label)
      : [...filters.labels, label];
    updateFilter("labels", newLabels);
  };

  const toggleTrackerFilter = (tracker: string) => {
    const newTrackers = filters.trackers.includes(tracker)
      ? filters.trackers.filter((t) => t !== tracker)
      : [...filters.trackers, tracker];
    updateFilter("trackers", newTrackers);
  };

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      state: "all",
      priority: "all",
      labels: [],
      trackers: [],
    });
  };

  const hasActiveFilters =
    filters.search !== "" ||
    filters.state !== "all" ||
    filters.priority !== "all" ||
    filters.labels.length > 0 ||
    filters.trackers.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search Input */}
      <div className="relative flex-1 min-w-50 max-w-75">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search torrents..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="pl-8 h-8"
        />
        {filters.search && (
          <button
            onClick={() => updateFilter("search", "")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* State Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {STATE_OPTIONS.find((s) => s.value === filters.state)?.label}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {STATE_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.state === option.value}
              onCheckedChange={() => updateFilter("state", option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Priority Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            {PRIORITY_OPTIONS.find((p) => p.value === filters.priority)?.label}
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {PRIORITY_OPTIONS.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={filters.priority === option.value}
              onCheckedChange={() => updateFilter("priority", option.value)}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Labels Filter */}
      {availableLabels.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Tags className="mr-1 h-3 w-3" />
              Labels
              {filters.labels.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filters.labels.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-50 p-2" align="start">
            <div className="space-y-1 max-h-50 overflow-auto">
              {availableLabels.map((label) => (
                <div
                  key={label}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-accent cursor-pointer"
                  onClick={() => toggleLabelFilter(label)}
                >
                  <Checkbox
                    checked={filters.labels.includes(label)}
                    onCheckedChange={() => toggleLabelFilter(label)}
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Trackers Filter */}
      {availableTrackers.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-1 h-3 w-3" />
              Trackers
              {filters.trackers.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {filters.trackers.length}
                </Badge>
              )}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-62 p-2" align="start">
            <div className="space-y-1 max-h-50 overflow-auto">
              {availableTrackers.map((tracker) => (
                <div
                  key={tracker}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-accent cursor-pointer"
                  onClick={() => toggleTrackerFilter(tracker)}
                >
                  <Checkbox
                    checked={filters.trackers.includes(tracker)}
                    onCheckedChange={() => toggleTrackerFilter(tracker)}
                  />
                  <span className="text-sm truncate" title={tracker}>
                    {tracker}
                  </span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={clearFilters}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Selection info and bulk actions */}
      {hasSelection && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectionCount} selected
          </span>
          <TorrentAction
            torrents={selectedTorrents}
            onUpdate={onUpdate}
            variant="button"
          />
        </div>
      )}
    </div>
  );
};

// Helper function to filter torrents based on filters
export const filterTorrents = (
  torrents: NormalizedTorrent[],
  filters: TorrentFilters
): NormalizedTorrent[] => {
  return torrents.filter((torrent) => {
    const raw = torrent.raw as RawTorrentData | undefined;

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!torrent.name.toLowerCase().includes(search)) {
        return false;
      }
    }

    // State filter
    if (filters.state !== "all" && torrent.state !== filters.state) {
      return false;
    }

    // Priority filter
    if (filters.priority !== "all") {
      const priority = raw?.bandwidthPriority ?? 0;
      const priorityMap = { high: 1, normal: 0, low: -1 };
      if (priority !== priorityMap[filters.priority]) {
        return false;
      }
    }

    // Labels filter
    if (filters.labels.length > 0) {
      const torrentLabels = raw?.labels || [];
      const hasMatchingLabel = filters.labels.some((label) =>
        torrentLabels.includes(label)
      );
      if (!hasMatchingLabel) {
        return false;
      }
    }

    // Trackers filter
    if (filters.trackers.length > 0) {
      // Get tracker host from torrent
      const trackerHost = getTrackerHost(torrent);
      if (!trackerHost || !filters.trackers.includes(trackerHost)) {
        return false;
      }
    }

    return true;
  });
};

// Helper to extract tracker host from torrent
export const getTrackerHost = (torrent: NormalizedTorrent): string | null => {
  const raw = torrent.raw as
    | { trackers?: Array<{ announce: string }> }
    | undefined;
  const trackers = raw?.trackers;

  if (!trackers || trackers.length === 0) {
    return null;
  }

  try {
    const url = new URL(trackers[0].announce);
    return url.hostname;
  } catch {
    return null;
  }
};

// Helper to extract unique labels from torrents
export const extractLabels = (torrents: NormalizedTorrent[]): string[] => {
  const labelsSet = new Set<string>();
  for (const torrent of torrents) {
    const raw = torrent.raw as RawTorrentData | undefined;
    const labels = raw?.labels || [];
    for (const label of labels) {
      labelsSet.add(label);
    }
  }
  return Array.from(labelsSet).sort();
};

// Helper to extract unique tracker hosts from torrents
export const extractTrackers = (torrents: NormalizedTorrent[]): string[] => {
  const trackersSet = new Set<string>();
  for (const torrent of torrents) {
    const host = getTrackerHost(torrent);
    if (host) {
      trackersSet.add(host);
    }
  }
  return Array.from(trackersSet).sort();
};
