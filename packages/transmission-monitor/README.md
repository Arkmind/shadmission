# Transmission Monitor

A microservice that monitors Transmission BitTorrent client's upload/download statistics and provides real-time updates via REST API and WebSocket.

## Features

- 📊 Real-time transfer statistics (upload/download speeds)
- 🔄 WebSocket support for live updates
- 📈 Historical data retention (configurable)
- 🎯 REST API for on-demand queries
- 🐳 Docker-ready

## Quick Start

```bash
# Install dependencies
npm install

# Development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `TRANSMISSION_URL` | `http://localhost:9091` | Transmission RPC URL |
| `TRANSMISSION_USER` | `arky` | Transmission username |
| `TRANSMISSION_PASS` | `arky` | Transmission password |
| `POLL_INTERVAL` | `1000` | Polling interval in ms |

## API Endpoints

### REST API

- `GET /health` - Health check
- `GET /api/stats` - Current transfer statistics
- `GET /api/torrents` - List all torrents
- `GET /api/history` - Historical statistics data

### WebSocket

Connect to `ws://localhost:3001` to receive real-time updates.

Message format:
```json
{
  "timestamp": 1703500000000,
  "downloadSpeed": 1234567,
  "uploadSpeed": 234567,
  "totalDownloaded": 12345678901,
  "totalUploaded": 1234567890,
  "activeTorrents": 3,
  "pausedTorrents": 5,
  "totalTorrents": 8
}
```

## Docker

```bash
# Build image
docker build -t transmission-monitor .

# Run container
docker run -p 3001:3001 \
  -e TRANSMISSION_URL=http://transmission:9091 \
  transmission-monitor
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Transmission   │────▶│  Monitor Service │────▶│  WebSocket/REST │
│  (BitTorrent)   │     │  (Polling)       │     │  (Clients)      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```
