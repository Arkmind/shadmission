import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";

import { GraphTooltip } from "@/components/graph-tooltip";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatSpeed, formatTime } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { useGraphSelectable } from "./context";

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

export const SelectableChart: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isConnected,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    endTimeOffset,
    setEndTimeOffset,
    confirmedSelection,
    setConfirmedSelection,
    isLive,
    clearSelection,
  } = useGraphSelectable();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const handleMouseDown = useCallback(
    (e: { activeLabel?: string | number }) => {
      if (e?.activeLabel !== undefined) {
        const timestamp =
          typeof e.activeLabel === "string"
            ? parseFloat(e.activeLabel)
            : e.activeLabel;
        setIsSelecting(true);
        setSelectionStart(timestamp);
        setSelectionEnd(timestamp);
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: { activeLabel?: string | number }) => {
      if (isSelecting && e?.activeLabel !== undefined) {
        const timestamp =
          typeof e.activeLabel === "string"
            ? parseFloat(e.activeLabel)
            : e.activeLabel;
        setSelectionEnd(timestamp);
      }
    },
    [isSelecting]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionStart !== null && selectionEnd !== null) {
      setConfirmedSelection({
        startTimestamp: selectionStart,
        endTimestamp: selectionEnd,
      });
    }
    setIsSelecting(false);
  }, [isSelecting, selectionStart, selectionEnd, setConfirmedSelection]);

  const handleClearSelection = useCallback(() => {
    setSelectionStart(null);
    setSelectionEnd(null);
    clearSelection();
  }, [clearSelection]);

  useEffect(() => {
    const handleShiftScroll = (event: WheelEvent) => {
      if (!event.shiftKey) return;
      event.preventDefault();
      const delta = event.deltaY;
      setEndTimeOffset((prev) => Math.max(0, prev + delta * 100));
    };

    const handleNormalScroll = (event: WheelEvent) => {
      if (event.shiftKey) return;
      event.preventDefault();
      const delta = event.deltaY;
      setTimeRange((prev) => Math.max(60 * 1000, prev + delta * 100));
    };

    const handleDoubleClick = () => {
      setEndTimeOffset(0);
      handleClearSelection();
    };

    const handleScroll = (event: WheelEvent) => {
      handleShiftScroll(event);
      handleNormalScroll(event);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleScroll, { passive: false });
      container.addEventListener("dblclick", handleDoubleClick);
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleScroll);
        container.removeEventListener("dblclick", handleDoubleClick);
      }
    };
  });

  if (isLoading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-10">
        <span className="text-muted-foreground">Loading snapshots...</span>
      </div>
    );
  }

  if (error && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-10">
        <span className="text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-crosshair flex justify-center select-none"
    >
      {/* Status bar */}
      <div className="absolute bottom-0 left-4 z-10 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>
          {formatTime(timeRange / 1000)}
          <span className="text-muted-foreground/50 mx-1">•</span>
          {isLive ? "Live" : formatTime(endTimeOffset / 1000)}
        </span>
        {!isLive && (
          <button
            onClick={() => setEndTimeOffset(0)}
            className="text-xs underline hover:text-foreground"
          >
            Back to live
          </button>
        )}
      </div>

      {confirmedSelection && (
        <button
          onClick={handleClearSelection}
          className="absolute top-2 right-4 z-10 text-xs bg-destructive/10 text-destructive px-2 py-1 rounded hover:bg-destructive/20"
        >
          Clear selection
        </button>
      )}

      <ChartContainer
        config={chartConfig}
        className="min-h-10 h-full w-full pb-4 aspect-auto"
      >
        <AreaChart
          data={data}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <linearGradient
              id="fillUploadSelectable"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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
            <linearGradient
              id="fillDownloadSelectable"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={16}
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
            width={80}
            tickFormatter={formatSpeed}
          />
          <ChartTooltip cursor={false} content={<GraphTooltip />} />
          <Area
            dataKey="download"
            type="monotone"
            fill="url(#fillDownloadSelectable)"
            stroke="var(--color-download)"
            isAnimationActive={false}
          />
          <Area
            dataKey="upload"
            type="monotone"
            fill="url(#fillUploadSelectable)"
            stroke="var(--color-upload)"
            isAnimationActive={false}
          />
          {(isSelecting || confirmedSelection) &&
            selectionStart !== null &&
            selectionEnd !== null && (
              <ReferenceArea
                x1={Math.min(
                  confirmedSelection?.startTimestamp ?? selectionStart,
                  confirmedSelection?.endTimestamp ?? selectionEnd
                )}
                x2={Math.max(
                  confirmedSelection?.startTimestamp ?? selectionStart,
                  confirmedSelection?.endTimestamp ?? selectionEnd
                )}
                strokeOpacity={0.3}
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                stroke="hsl(var(--primary))"
              />
            )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
};
