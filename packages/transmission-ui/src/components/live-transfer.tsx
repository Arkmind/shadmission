import { useSnapshots } from "@/hooks/use-snapshots";
import { ArrowDown, ArrowUp } from "lucide-react";
import { type FC, useMemo } from "react";

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

  return (
    <div className="flex justify-evenly space-x-16">
      <div className="flex items-center">
        <ArrowUp
          className={isConnected ? "text-blue-500" : "text-muted-foreground"}
        />
        <h1 className="text-2xl font-bold">{currentSpeed.upload.value}</h1>
        <span className="ml-1 text-xl font-light">
          {currentSpeed.upload.unit}
        </span>
      </div>
      <div className="flex items-center">
        <ArrowDown
          className={isConnected ? "text-green-500" : "text-muted-foreground"}
        />
        <h1 className="text-2xl font-bold">{currentSpeed.download.value}</h1>
        <span className="ml-1 text-xl font-light">
          {currentSpeed.download.unit}
        </span>
      </div>
    </div>
  );
};
