import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { GraphTooltip } from "@/components/graph-tooltip";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { useSnapshots } from "@/hooks/use-snapshots";
import { formatSpeed, formatTime } from "@/lib/utils";
import { useEffect, useMemo, useRef, useState, type FC } from "react";

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

export const Graph: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isConnected, isLoading, error, updateSnapshot } =
    useSnapshots();

  // Time range in milliseconds (default 5 minutes)
  const [timeRange, setTimeRange] = useState(300 * 1000);
  // End time offset from now (0 = live, positive = looking at history)
  const [endTimeOffset, setEndTimeOffset] = useState(0);

  const isLive = useMemo(() => endTimeOffset === 0, [endTimeOffset]);

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
    };

    const handleScroll = (event: WheelEvent) => {
      handleShiftScroll(event);
      handleNormalScroll(event);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleScroll, {
        passive: false,
      });
      container.addEventListener("dblclick", handleDoubleClick);
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleScroll);
        container.removeEventListener("dblclick", handleDoubleClick);
      }
    };
  });

  useEffect(() => {
    updateSnapshot({
      from: Date.now() - timeRange - endTimeOffset,
      to: Date.now() - endTimeOffset,
      offset: endTimeOffset,
    });
  }, [timeRange, endTimeOffset]);

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

      <ChartContainer
        config={chartConfig}
        className="min-h-52 h-full w-full pb-4"
      >
        <AreaChart data={data}>
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
            dataKey="timestamp"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={32}
            tickFormatter={(value) => {
              return new Date(value).toLocaleTimeString(navigator.language, {
                hour: "numeric",
                minute: "numeric",
                second: "numeric",
                hour12: false,
              });
            }}
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
