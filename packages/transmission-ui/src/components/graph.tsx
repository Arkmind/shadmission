import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { GraphTooltip } from "@/components/graph-tooltip";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { UseSnapshotsReturn } from "@/hooks/use-snapshots";
import { formatSpeed } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";

const chartConfig = {
  upload: {
    label: "Upload",
    color: "var(--chart-1)",
  },
  download: {
    label: "Download",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export interface GraphProps {
  snapshots: UseSnapshotsReturn;
}

export const Graph: FC<GraphProps> = ({ snapshots }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isConnected, isLoading, error, loadMoreData } = snapshots;

  // Time range in milliseconds (default 5 minutes)
  const [timeRange, setTimeRange] = useState(300 * 1000);
  // End time offset from now (0 = live, positive = looking at history)
  const [endTimeOffset, setEndTimeOffset] = useState(0);
  // Locked reference time when panning (prevents graph from shifting with new data)
  const [lockedTime, setLockedTime] = useState<number | null>(null);
  // Whether we're in "live" mode (following new data)
  const isLive = endTimeOffset === 0 && lockedTime === null;

  // Calculate fixed domain for X-axis to prevent wobbling
  const xDomain = useMemo(() => {
    if (data.length === 0) return [Date.now() - timeRange, Date.now()];

    const referenceTime = lockedTime ?? data[data.length - 1].date;
    const endTime = referenceTime - endTimeOffset;
    const startTime = endTime - timeRange;

    return [startTime, endTime];
  }, [data, timeRange, endTimeOffset, lockedTime]);

  // Filter data based on time range and offset
  const filteredData = useMemo(() => {
    if (data.length === 0) return [];

    const [startTime, endTime] = xDomain;

    return data.filter(
      (item) => item.date >= startTime && item.date <= endTime
    );
  }, [data, xDomain]);

  // Load more data when zooming out or scrolling back
  const loadMoreDataRef = useRef(loadMoreData);
  loadMoreDataRef.current = loadMoreData;
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const currentData = dataRef.current;
    const requiredSeconds = Math.ceil((timeRange + endTimeOffset) / 1000);
    const currentDataSpan =
      currentData.length > 0 ? (Date.now() - currentData[0].date) / 1000 : 0;

    if (requiredSeconds > currentDataSpan + 60) {
      loadMoreDataRef.current(Math.min(requiredSeconds + 120, 86400)); // Load extra buffer, max 24h
    }
  }, [timeRange, endTimeOffset]);

  const handleScroll = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;

      if (e.shiftKey) {
        // Lock the time on first pan if not already locked
        if (lockedTime === null && data.length > 0) {
          setLockedTime(data[data.length - 1].date);
        }

        // Shift + scroll: Pan through time (change end time offset)
        setEndTimeOffset((prev) => {
          const newOffset = prev + delta * 100; // 100ms per scroll unit
          if (newOffset < 0) {
            // Return to live mode when scrolling back to present
            setLockedTime(null);
            return 0;
          }

          // Allow panning up to 24 hours back (will trigger data load if needed)
          const maxOffset = 24 * 60 * 60 * 1000; // 24 hours in ms
          return Math.min(newOffset, maxOffset);
        });
      } else {
        // Normal scroll: Zoom (change time range)
        setTimeRange((prev) => {
          const zoomFactor = delta > 0 ? 1.1 : 0.9;
          let newRange = prev * zoomFactor;

          // Clamp between 30 seconds and 24 hours
          newRange = Math.max(30_000, Math.min(86_400_000, newRange));
          return newRange;
        });
      }
    },
    [data, lockedTime]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleScroll, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleScroll);
      }
    };
  }, [handleScroll]);

  // Double-click to return to live mode
  const handleDoubleClick = useCallback(() => {
    setEndTimeOffset(0);
    setLockedTime(null);
  }, []);

  const statusText = useMemo(() => {
    const rangeSeconds = Math.round(timeRange / 1000);
    let rangeText: string;

    if (rangeSeconds >= 3600) {
      rangeText = `${(rangeSeconds / 3600).toFixed(1)}h`;
    } else if (rangeSeconds >= 60) {
      rangeText = `${Math.round(rangeSeconds / 60)}m`;
    } else {
      rangeText = `${rangeSeconds}s`;
    }

    if (!isLive) {
      const offsetSeconds = Math.round(endTimeOffset / 1000);
      let offsetText: string;

      if (offsetSeconds >= 3600) {
        offsetText = `${(offsetSeconds / 3600).toFixed(1)}h ago`;
      } else if (offsetSeconds >= 60) {
        offsetText = `${Math.round(offsetSeconds / 60)}m ago`;
      } else {
        offsetText = `${offsetSeconds}s ago`;
      }
      return `${rangeText} window • ${offsetText}`;
    }
    return `${rangeText} • Live`;
  }, [timeRange, endTimeOffset, isLive]);

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-52">
        <span className="text-muted-foreground">Loading snapshots...</span>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-52">
        <span className="text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
    >
      {/* Status bar */}
      <div className="absolute bottom-0 left-4 z-10 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>{statusText}</span>
        {!isLive && (
          <button
            onClick={handleDoubleClick}
            className="text-xs underline hover:text-foreground"
          >
            Back to live
          </button>
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className="min-h-52 h-full w-full pb-4"
        onDoubleClick={handleDoubleClick}
      >
        <AreaChart data={filteredData}>
          <defs>
            <linearGradient id="fillUpload" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-upload)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-upload)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillDownload" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-download)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-download)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            type="number"
            domain={xDomain}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) =>
              new Date(value).toLocaleTimeString(navigator.language, {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false,
              })
            }
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={90}
            tickFormatter={formatSpeed}
          />
          <ChartTooltip cursor={false} content={<GraphTooltip />} />
          <Area
            dataKey="download"
            type="monotone"
            fill="url(#fillDownload)"
            stroke="var(--color-download)"
            isAnimationActive={false}
          />
          <Area
            dataKey="upload"
            type="monotone"
            fill="url(#fillUpload)"
            stroke="var(--color-upload)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
