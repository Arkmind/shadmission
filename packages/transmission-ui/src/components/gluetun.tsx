import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GLUETUN_ENABLED, requestGluetun } from "@/lib/gluetun";
import { cn } from "@/lib/utils";
import { Globe, MapPin, RefreshCw, Server, Shield, Wifi } from "lucide-react";
import { type FC, useCallback, useEffect, useState } from "react";

interface PublicIPResponse {
  public_ip: string;
  country: string;
  city: string;
  organization: string;
}

interface VPNStatusResponse {
  status: string;
}

interface PortForwardResponse {
  port: number;
}

interface GluetunState {
  publicIP: string | null;
  country: string | null;
  city: string | null;
  organization: string | null;
  vpnStatus: string | null;
  forwardedPort: number | null;
  isLoading: boolean;
  error: string | null;
}

export const GluetunStatus: FC = () => {
  const [status, setStatus] = useState<GluetunState>({
    publicIP: null,
    country: null,
    city: null,
    organization: null,
    vpnStatus: null,
    forwardedPort: null,
    isLoading: true,
    error: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!GLUETUN_ENABLED) {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: "Gluetun disabled",
      }));
      return;
    }

    try {
      setIsRefreshing(true);

      const [ipData, vpnData, portData] = await Promise.allSettled([
        requestGluetun("/v1/publicip/ip"),
        requestGluetun("/v1/vpn/status"),
        requestGluetun("/v1/portforward"),
      ]);

      const newStatus: Partial<GluetunState> = {
        isLoading: false,
        error: null,
      };

      if (ipData.status === "fulfilled") {
        const ip = ipData.value as unknown as PublicIPResponse;
        newStatus.publicIP = ip.public_ip || null;
        newStatus.country = ip.country || null;
        newStatus.city = ip.city || null;
        newStatus.organization = ip.organization || null;
      }

      if (vpnData.status === "fulfilled") {
        const vpn = vpnData.value as unknown as VPNStatusResponse;
        newStatus.vpnStatus = vpn.status || null;
      }

      if (portData.status === "fulfilled") {
        const port = portData.value as unknown as PortForwardResponse;
        newStatus.forwardedPort = port.port || null;
      }

      setStatus((prev) => ({ ...prev, ...newStatus }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to fetch",
      }));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (!GLUETUN_ENABLED) return null;

  const isConnected = status.vpnStatus === "running";

  return (
    <div className="flex flex-col h-full p-3 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Gluetun</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={fetchStatus}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={cn("w-3 h-3", isRefreshing && "animate-spin")}
          />
        </Button>
      </div>

      {status.error ? (
        <Badge variant="destructive">{status.error}</Badge>
      ) : status.isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {/* Status */}
          <div className="flex items-center gap-2">
            <Shield
              className={cn(
                "w-3.5 h-3.5",
                isConnected ? "text-green-500" : "text-destructive"
              )}
            />
            <span className="text-muted-foreground">Status</span>
          </div>
          <div className="flex justify-end">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {status.vpnStatus || "Unknown"}
            </Badge>
          </div>

          {/* Port */}
          <div className="flex items-center gap-2">
            <Wifi
              className={cn(
                "w-3.5 h-3.5",
                status.forwardedPort
                  ? "text-green-500"
                  : "text-muted-foreground"
              )}
            />
            <span className="text-muted-foreground">Port</span>
          </div>
          <span className="font-mono text-right">
            {status.forwardedPort || "N/A"}
          </span>

          <Separator className="col-span-2 my-1" />

          {/* IP */}
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">IP</span>
          </div>
          <span
            className="font-mono text-right truncate"
            title={status.publicIP || undefined}
          >
            {status.publicIP || "N/A"}
          </span>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-muted-foreground">Location</span>
          </div>
          <span
            className="text-right truncate"
            title={[status.city, status.country].filter(Boolean).join(", ")}
          >
            {[status.city, status.country].filter(Boolean).join(", ") || "N/A"}
          </span>

          {/* Provider */}
          {status.organization && (
            <>
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-muted-foreground">Provider</span>
              </div>
              <span className="text-right truncate" title={status.organization}>
                {status.organization}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GluetunStatus;
