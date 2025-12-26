import { useSnapshots } from "@/hooks/use-snapshots";
import { getSessionStats } from "@/lib/transmission";
import { cn, formatBytes } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type FC, useEffect, useMemo, useState } from "react";

const formatSpeed = (bytes: number): { value: string; unit: string } => {
  if (bytes === 0) return { value: "0", unit: "B/s" };
  const k = 1024;
  const sizes = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    value: parseFloat((bytes / Math.pow(k, i)).toFixed(1)).toString(),
    unit: sizes[i],
  };
};

export const LiveTransfer: FC = () => {
  const { data, isConnected } = useSnapshots({
    bufferSize: 1,
  });
  const [sessionTotals, setSessionTotals] = useState({
    uploaded: 0,
    downloaded: 0,
  });

  const currentSpeed = useMemo(() => {
    if (data.length === 0) {
      return {
        upload: { value: "0", unit: "B/s" },
        download: { value: "0", unit: "B/s" },
      };
    }
    const latest = data[data.length - 1];
    return {
      upload: formatSpeed(latest.upload || 0),
      download: formatSpeed(latest.download || 0),
    };
  }, [data]);

  // Fetch session stats from Transmission
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getSessionStats();
        setSessionTotals({
          uploaded: stats["current-stats"].uploadedBytes,
          downloaded: stats["current-stats"].downloadedBytes,
        });
      } catch {
        // Silently fail - totals will just show 0
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="flex justify-evenly w-full">
        <div className="flex items-end">
          <ArrowUp
            className={cn(
              "h-5 w-5",
              isConnected ? "text-blue-500" : "text-muted-foreground"
            )}
          />
          <h1 className="text-2xl! font-bold leading-none">
            {currentSpeed.upload.value}
          </h1>
          <span className="ml-1 font-light text-xs">
            {currentSpeed.upload.unit}
          </span>
        </div>
        <div className="flex items-end">
          <ArrowDown
            className={cn(
              "h-5 w-5",
              isConnected ? "text-green-500" : "text-muted-foreground"
            )}
          />
          <h1 className="text-2xl! font-bold leading-none">
            {currentSpeed.download.value}
          </h1>
          <span className="ml-1 font-light text-xs">
            {currentSpeed.download.unit}
          </span>
        </div>
      </div>
      <div className="flex justify-evenly w-full">
        <div className="flex gap-1 text-xs justify-center text-muted-foreground">
          <span>Total:</span>
          <span>{formatBytes(sessionTotals.uploaded)}</span>
        </div>
        <div className="flex gap-1 text-xs justify-center text-muted-foreground">
          <span>Total:</span>
          <span>{formatBytes(sessionTotals.downloaded)}</span>
        </div>
      </div>
    </div>
  );
};
