import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { TransmissionMonitor } from "./monitor.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const TRANSMISSION_URL =
  process.env.TRANSMISSION_URL || "http://localhost:9091";
const TRANSMISSION_USER = process.env.TRANSMISSION_USER || "arky";
const TRANSMISSION_PASS = process.env.TRANSMISSION_PASS || "arky";
const POLL_INTERVAL = Number(process.env.POLL_INTERVAL) || 1000;

const monitor = new TransmissionMonitor({
  url: TRANSMISSION_URL,
  username: TRANSMISSION_USER,
  password: TRANSMISSION_PASS,
  pollInterval: POLL_INTERVAL,
});

// Middleware
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get current stats
app.get("/api/stats", async (_req, res) => {
  try {
    const stats = await monitor.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get all torrents
app.get("/api/torrents", async (_req, res) => {
  try {
    const torrents = await monitor.getTorrents();
    res.json(torrents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch torrents" });
  }
});

// Get historical data
app.get("/api/history", (_req, res) => {
  const history = monitor.getHistory();
  res.json(history);
});

// WebSocket connections for real-time updates
wss.on("connection", (ws) => {
  console.log("Client connected via WebSocket");

  const unsubscribe = monitor.subscribe((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    unsubscribe();
  });
});

// Start the monitor
monitor.start();

server.listen(PORT, () => {
  console.log(`🚀 Transmission Monitor running on port ${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down...");
  monitor.stop();
  server.close();
});
