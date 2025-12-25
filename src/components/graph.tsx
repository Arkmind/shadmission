import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useEffect, useRef, useState, type FC } from "react";

export const description = "An interactive area chart";

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  upload: {
    label: "Upload",
    color: "var(--chart-1)",
  },
  download: {
    label: "Download",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface GraphData {
  date: number;
  upload: number;
  download: number;
}

export interface GraphProps {
  data: GraphData[];
}

export const Graph: FC<GraphProps> = ({ data: defaultData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GraphData[]>(defaultData);
  const [lastDate, setLastDate] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState(300000);

  const filteredData = data
    .filter((item) => (lastDate ? item.date < lastDate : true))
    .filter((item) => {
      return new Date(item.date) >= new Date(new Date().getTime() - timeRange);
    });

  useEffect(() => {
    const handleShiftScroll = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
    };

    const handleNormalScroll = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      setTimeRange((prev) => {
        let newRange = prev + delta * 1000;
        if (newRange < 60000) newRange = 60000; // Minimum 1 minute
        if (newRange > 86400000) newRange = 86400000; // Maximum 24 hours
        return newRange;
      });
    };

    const handleScroll = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        console.log("Zooming in");
      }
    };
  }, []);

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className="min-h-52 h-full w-full"
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
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                new Date(value).toLocaleTimeString(navigator.language, {
                  hour: "numeric",
                  minute: "numeric",
                  second: "numeric",
                  day: "numeric",
                  month: "short",
                })
              }
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="download"
          type="natural"
          fill="url(#fillDownload)"
          stroke="var(--color-download)"
          stackId="a"
        />
        <Area
          dataKey="upload"
          type="natural"
          fill="url(#fillUpload)"
          stroke="var(--color-upload)"
          stackId="a"
        />
      </AreaChart>
    </ChartContainer>
  );
};
