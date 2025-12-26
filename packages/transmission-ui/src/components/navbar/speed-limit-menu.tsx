import { client } from "@/lib/transmission";
import { cn } from "@/lib/utils";
import { IconSpeedboat } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SpeedLimit {
  label: string;
  down: number;
  up: number;
}

interface SessionResponse {
  arguments: {
    "alt-speed-enabled"?: boolean;
    "alt-speed-down"?: number;
    "alt-speed-up"?: number;
  };
}

const speedLimits: SpeedLimit[] = [
  { label: "Unlimited", down: 0, up: 0 },
  { label: "Slow (100 KB/s)", down: 100, up: 50 },
  { label: "Medium (500 KB/s)", down: 500, up: 250 },
  { label: "Fast (2 MB/s)", down: 2048, up: 1024 },
  { label: "Very Fast (10 MB/s)", down: 10240, up: 5120 },
];

export const SpeedLimitMenu: React.FC = () => {
  const [altSpeedEnabled, setAltSpeedEnabled] = useState(false);
  const [currentSpeedLimit, setCurrentSpeedLimit] = useState<SpeedLimit>(
    speedLimits[0]
  );

  useEffect(() => {
    const fetchAltSpeed = async () => {
      try {
        const response = await client.request<SessionResponse>("session-get", {
          fields: ["alt-speed-enabled", "alt-speed-down", "alt-speed-up"],
        });

        const data = response._data?.arguments;
        if (!data) return;

        const isEnabled = data["alt-speed-enabled"] ?? false;
        setAltSpeedEnabled(isEnabled);

        if (isEnabled) {
          const down = data["alt-speed-down"] ?? 0;
          const up = data["alt-speed-up"] ?? 0;
          const matchingLimit = speedLimits.find(
            (limit) => limit.down === down && limit.up === up
          );
          setCurrentSpeedLimit(matchingLimit ?? { label: "Custom", down, up });
        } else {
          setCurrentSpeedLimit(speedLimits[0]);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        setCurrentSpeedLimit(speedLimits[0]);
      }
    };
    fetchAltSpeed();
  }, []);

  const handleSpeedLimit = useCallback(async (limit: SpeedLimit) => {
    try {
      if (limit.down === 0 && limit.up === 0) {
        await client.request("session-set", {
          "alt-speed-enabled": false,
          "speed-limit-down-enabled": false,
          "speed-limit-up-enabled": false,
        });
        setAltSpeedEnabled(false);
        setCurrentSpeedLimit(limit);
        toast.success("Speed limits disabled");
      } else {
        await client.request("session-set", {
          "alt-speed-enabled": true,
          "alt-speed-down": limit.down,
          "alt-speed-up": limit.up,
        });
        setAltSpeedEnabled(true);
        setCurrentSpeedLimit(limit);
        toast.success(`Speed limit set to ${limit.label}`);
      }
    } catch (error) {
      console.error("Failed to set speed limit:", error);
      toast.error("Failed to set speed limit", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }, []);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn("size-10", altSpeedEnabled && "text-yellow-500")}
            >
              <IconSpeedboat className="size-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">Speed Limits</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuLabel>Speed Limits</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {speedLimits.map((limit) => {
          const isActive =
            currentSpeedLimit.down === limit.down &&
            currentSpeedLimit.up === limit.up;
          return (
            <DropdownMenuItem
              key={limit.label}
              onClick={() => handleSpeedLimit(limit)}
              className={cn(isActive && "bg-accent font-medium")}
            >
              {limit.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
