import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import {
  cleanupOldSnapshots,
  getSnapshots,
  getSnapshotsByRange,
  saveSnapshot,
} from "./database.js";
import { getTransferSnapshot } from "./monitor.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT ?? 3000;
const SNAPSHOT_INTERVAL_MS = 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup every hour

// CORS middleware
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CORS_ORIGINS ?? "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Store connected WebSocket clients
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`Client connected. Total clients: ${clients.size}`);

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`Client disconnected. Total clients: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

const broadcastSnapshot = (snapshot: object) => {
  const message = JSON.stringify(snapshot);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
};

// Collect and save snapshot every second
const collectSnapshot = async () => {
  try {
    const snapshot = await getTransferSnapshot();
    saveSnapshot(snapshot);
    broadcastSnapshot(snapshot);
  } catch (error) {
    console.error("Error collecting snapshot:", error);
  }
};

// Self-correcting interval that aligns to the second
const startSnapshotCollection = () => {
  const tick = () => {
    collectSnapshot();
    const now = Date.now();
    const nextTick = SNAPSHOT_INTERVAL_MS - (now % SNAPSHOT_INTERVAL_MS);
    setTimeout(tick, nextTick);
  };

  // Start at the next whole second
  const now = Date.now();
  const firstTick = SNAPSHOT_INTERVAL_MS - (now % SNAPSHOT_INTERVAL_MS);
  setTimeout(tick, firstTick);
};

// REST endpoint to get snapshots - supports either seconds or from/to timestamps
app.get("/snapshots", (req, res) => {
  const from = parseInt(req.query.from as string);
  const to = parseInt(req.query.to as string);

  // If from/to provided, use range query
  if (!isNaN(from) && !isNaN(to)) {
    const maxRange = 24 * 60 * 60 * 1000; // Max 24 hours
    const now = Date.now();
    const cutoff = now - maxRange;

    // Clamp to valid range
    const clampedFrom = Math.max(from, cutoff);
    const clampedTo = Math.min(to, now);

    const snapshots = getSnapshotsByRange(clampedFrom, clampedTo);
    res.json({
      count: snapshots.length,
      from: clampedFrom,
      to: clampedTo,
      snapshots,
    });
    return;
  }

  // Fallback to seconds-based query
  const seconds = parseInt(req.query.seconds as string) || 60;
  const maxSeconds = 24 * 60 * 60; // Max 24 hours

  const clampedSeconds = Math.min(Math.max(1, seconds), maxSeconds);
  const snapshots = getSnapshots(clampedSeconds);

  res.json({
    count: snapshots.length,
    seconds: clampedSeconds,
    snapshots,
  });
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Gluetun proxy endpoints (to avoid CORS issues)
const GLUETUN_HOST = process.env.GLUETUN_HOST ?? "gluetun";
const GLUETUN_PORT = process.env.GLUETUN_PORT ?? "8000";
const GLUETUN_AUTH = process.env.GLUETUN_AUTH ?? ""; // "apikey" or "basic"
const GLUETUN_API_KEY = process.env.GLUETUN_API_KEY ?? "";
const GLUETUN_USERNAME = process.env.GLUETUN_USERNAME ?? "";
const GLUETUN_PASSWORD = process.env.GLUETUN_PASSWORD ?? "";

const fetchGluetun = async (path: string) => {
  const url = `http://${GLUETUN_HOST}:${GLUETUN_PORT}${path}`;
  const headers: Record<string, string> = {};

  if (GLUETUN_AUTH === "apikey" && GLUETUN_API_KEY) {
    headers["X-API-Key"] = GLUETUN_API_KEY;
  } else if (GLUETUN_AUTH === "basic" && GLUETUN_USERNAME && GLUETUN_PASSWORD) {
    headers["Authorization"] = `Basic ${Buffer.from(
      `${GLUETUN_USERNAME}:${GLUETUN_PASSWORD}`
    ).toString("base64")}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    console.error(
      `Gluetun API error: ${response.status} ${response.statusText}`
    );
    throw new Error(`Gluetun API error: ${response.status}`);
  }
  return response.json();
};

app.get("/gluetun/publicip", async (_req, res) => {
  try {
    const data = await fetchGluetun("/v1/publicip/ip");
    res.json(data);
  } catch (error) {
    console.error("Error fetching Gluetun public IP:", error);
    res.status(502).json({ error: "Failed to fetch public IP from Gluetun" });
  }
});

app.get("/gluetun/portforward", async (_req, res) => {
  try {
    const data = await fetchGluetun("/v1/portforward");
    res.json(data);
  } catch (error) {
    console.error("Error fetching Gluetun port forward:", error);
    res
      .status(502)
      .json({ error: "Failed to fetch port forward from Gluetun" });
  }
});

app.get("/gluetun/vpn/status", async (_req, res) => {
  try {
    const data = await fetchGluetun("/v1/vpn/status");
    res.json(data);
  } catch (error) {
    console.error("Error fetching Gluetun VPN status:", error);
    res.status(502).json({ error: "Failed to fetch VPN status from Gluetun" });
  }
});

app.get("/gluetun/dns/status", async (_req, res) => {
  try {
    const data = await fetchGluetun("/v1/dns/status");
    res.json(data);
  } catch (error) {
    console.error("Error fetching Gluetun DNS status:", error);
    res.status(502).json({ error: "Failed to fetch DNS status from Gluetun" });
  }
});

// Start snapshot collection
startSnapshotCollection();

// Cleanup old snapshots periodically
setInterval(() => {
  const deleted = cleanupOldSnapshots();
  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} old snapshots`);
  }
}, CLEANUP_INTERVAL_MS);

// Initial cleanup on startup
cleanupOldSnapshots();

server.listen(PORT, () => {
  console.log(`Transmission Monitor running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/snapshots?seconds=60`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
