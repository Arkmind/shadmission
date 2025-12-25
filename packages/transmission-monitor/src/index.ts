import express from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { cleanupOldSnapshots, getSnapshots, saveSnapshot } from "./database.js";
import { getTransferSnapshot } from "./monitor.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT ?? 3000;
const SNAPSHOT_INTERVAL_MS = 1000;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup every hour

// CORS middleware
app.use((_req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
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

// REST endpoint to get X seconds of snapshots
app.get("/snapshots", (req, res) => {
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
