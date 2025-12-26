// Gluetun API is proxied through the monitor service to avoid CORS issues
export const MONITOR_URL =
  import.meta.env.VITE_MONITOR_URL ?? "http://localhost:3000";
export const GLUETUN_ENABLED = import.meta.env.VITE_GLUETUN_ENABLED === "true";

export const isGluetunEnabled = () => GLUETUN_ENABLED;

const getMonitorUrl = () => {
  return MONITOR_URL;
};

export const requestGluetun = async (route: string): Promise<string> => {
  if (!GLUETUN_ENABLED) {
    throw new Error("Gluetun integration is disabled");
  }

  // Map Gluetun routes to monitor proxy endpoints
  const routeMap: Record<string, string> = {
    "/v1/publicip/ip": "/gluetun/publicip",
    "/v1/portforward": "/gluetun/portforward",
    "/v1/vpn/status": "/gluetun/vpn/status",
    "/v1/dns/status": "/gluetun/dns/status",
  };

  const proxyRoute = routeMap[route];
  if (!proxyRoute) {
    throw new Error(`Unknown Gluetun route: ${route}`);
  }

  const url = `${getMonitorUrl()}${proxyRoute}`;

  try {
    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Gluetun data:", error);
    throw error;
  }
};

export const getGluetunIP = async (): Promise<string> => {
  try {
    const data = await requestGluetun("/v1/publicip/ip");
    console.log("Gluetun Public IP:", data);
  } catch (error) {
    console.error("Failed to get Gluetun IP:", error);
  }
  return "";
};
