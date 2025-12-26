<div align="center">

# 🌊 Shadmission

**A modern, beautiful web UI for Transmission BitTorrent client**

*Built with React, Vite, shadcn/ui, and Tailwind CSS*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF.svg)](https://vite.dev/)
[![shadcn/ui](https://img.shields.io/badge/shadcn--ui-Components-7C3AED.svg)](https://ui.shadcn.com/)

</div>

---

## ✨ Features

- 🎨 **Beautiful Modern UI** - Clean interface built with shadcn/ui components and Tailwind CSS
- 📊 **Real-time Statistics** - Live upload/download speed graphs with WebSocket updates
- 📈 **Historical Data** - View transfer statistics over time (up to 24 hours)
- 🌙 **Dark/Light Mode** - Full theme support with system preference detection
- 🔒 **VPN Integration** - Native Gluetun support for VPN status, public IP, and port forwarding
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices
- 🔍 **Advanced Filtering** - Filter torrents by state, labels, trackers, and search
- ⚡ **Fast & Lightweight** - Built with Vite and SWC for optimal performance

## 📸 Screenshots

![Dashboard](/assets/screenshots/dashboard_active.png)
![Dashboard With Panel](/assets/screenshots/dashboard_panel.png)
![Graph](/assets/screenshots/graph_selection.png)
![Settings](/assets/screenshots/settings.png)
![Torrent Add](/assets/screenshots/torrent_add.png)

## 🏗️ Architecture

Shadmission consists of two main packages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Shadmission                                │
├─────────────────────────────────┬───────────────────────────────────────┤
│      transmission-ui            │       transmission-monitor            │
│  (React Frontend)               │       (Node.js Backend)               │
├─────────────────────────────────┼───────────────────────────────────────┤
│  • React 19 + TypeScript        │  • Express.js REST API                │
│  • shadcn/ui Components         │  • WebSocket real-time updates        │
│  • Recharts for graphs          │  • SQLite for historical data         │
│  • Tailwind CSS 4               │  • Gluetun API proxy                  │
└─────────────────────────────────┴───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Transmission                                  │
│                       (BitTorrent Client)                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### transmission-ui

The frontend React application that provides the user interface. It communicates directly with Transmission's RPC API for torrent management and with the monitor service for real-time statistics.

### transmission-monitor

A lightweight Node.js microservice that:
- Polls Transmission every second for transfer statistics
- Stores historical data in SQLite (up to 24 hours)
- Broadcasts real-time updates via WebSocket
- Proxies Gluetun API requests to avoid CORS issues

## 🚀 Installation

### Option 1: Docker with Docker Compose (Recommended)

This is the recommended setup, especially if you want VPN integration with Gluetun.

#### Prerequisites

- Docker and Docker Compose installed
- A VPN provider account (optional, for Gluetun integration)

#### 1. Clone the repository

```bash
git clone https://github.com/Arkmind/shadmission.git
cd shadmission
```

#### 2. Create environment file

Create a `.env` file in the root directory (you can copy from `.env.example`):

```env
# Transmission credentials
TRANSMISSION_USERNAME=your_username
TRANSMISSION_PASSWORD=your_password

# VPN Configuration (for Gluetun)
OPENVPN_USER=your_vpn_username
OPENVPN_PASSWORD=your_vpn_password

# Gluetun API credentials
# Configure in /gluetun/auth/config.toml
# See: https://github.com/qdm12/gluetun-wiki/blob/main/setup/advanced/control-server.md#authentication
GLUETUN_AUTH=apikey
GLUETUN_API_KEY=your_api_key_here
```

#### 3. Build the UI

```bash
npm install
npm run build:ui
```

The built files will be in `transmission_ui/` directory.

#### 4. Start the services

```bash
docker-compose up -d
```

#### 5. Access the UI

Open your browser and navigate to:
- **Transmission UI**: `http://localhost:9091/transmission/web`

### Docker Services Overview

The `docker-compose.yml` includes three services:

| Service | Description | Port |
|---------|-------------|------|
| `gluetun` | VPN client container with port forwarding | 8000 (control), 9091 (transmission) |
| `transmission` | BitTorrent client (runs through gluetun network) | - |
| `transmission-monitor` | Statistics monitor service (runs through gluetun network) | - |

All services share the gluetun network (`network_mode: "service:gluetun"`), ensuring all torrent traffic goes through the VPN.

**Volumes:**
- `transmission_config` - Transmission configuration (Docker volume)
- `./transmission_ui` - Built UI files (mounted as webui)
- `./downloads` - Downloaded files
- `./monitor_config` - Monitor SQLite database
- `./gluetun` - Gluetun configuration and auth

### Option 2: Manual Installation (Development)

#### Prerequisites

- Node.js 22+ 
- npm 11+
- A running Transmission instance with RPC enabled

#### 1. Clone and install dependencies

```bash
git clone https://github.com/yourusername/shadmission.git
cd shadmission
npm install
```

#### 2. Configure environment variables

Create `.env` files for each package:

**packages/transmission-monitor/.env**
```env
PORT=3000
TRANSMISSION_URL=http://localhost:9091
TRANSMISSION_USER=your_username
TRANSMISSION_PASS=your_password
POLL_INTERVAL=1000

CORS_ORIGINS=http://localhost:5173,http://localhost:9091

# Gluetun proxy config (optional)
GLUETUN_HOST=localhost
GLUETUN_PORT=8000
GLUETUN_AUTH=apikey
GLUETUN_API_KEY=your_api_key_here
# Or for basic auth:
# GLUETUN_AUTH=basic
# GLUETUN_USERNAME=your_username
# GLUETUN_PASSWORD=your_password
```

**packages/transmission-ui/.env**
```env
# Gluetun VPN integration (proxied through monitor service)
VITE_GLUETUN_ENABLED=false

# Monitor service connection
VITE_MONITOR_HOST=localhost
VITE_MONITOR_PORT=3000
```

#### 3. Start development servers

```bash
# Start both UI and monitor in development mode
npm run dev

# Or start them separately
npm run dev:ui      # Start UI only
npm run dev:monitor # Start monitor only
```

#### 4. Build for production

```bash
npm run build
```

## 🔧 Configuration

### Environment Variables

#### transmission-ui

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MONITOR_HOST` | `localhost` | Monitor service hostname |
| `VITE_MONITOR_PORT` | `3000` | Monitor service port |
| `VITE_GLUETUN_ENABLED` | `false` | Enable Gluetun VPN status display |

#### transmission-monitor

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `TRANSMISSION_URL` | `http://localhost:9091` | Transmission RPC URL |
| `TRANSMISSION_USER` | - | Transmission username |
| `TRANSMISSION_PASS` | - | Transmission password |
| `POLL_INTERVAL` | `1000` | Polling interval in ms |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |
| `GLUETUN_HOST` | `gluetun` | Gluetun container hostname |
| `GLUETUN_PORT` | `8000` | Gluetun HTTP control port |
| `GLUETUN_AUTH` | - | Auth type: `apikey` or `basic` |
| `GLUETUN_API_KEY` | - | API key for Gluetun (if using apikey auth) |
| `GLUETUN_USERNAME` | - | Username for Gluetun (if using basic auth) |
| `GLUETUN_PASSWORD` | - | Password for Gluetun (if using basic auth) |

## 🔒 Gluetun VPN Integration

Shadmission has built-in support for [Gluetun](https://github.com/qdm12/gluetun), a lightweight VPN client container that supports many VPN providers.

### Features

When Gluetun is enabled, the UI displays:
- 🌐 **Public IP** - Your current VPN IP address
- 📍 **Location** - Country and city of VPN server
- 🔌 **Port Forwarding** - Active forwarded port (if supported by VPN)
- ✅ **VPN Status** - Connection status indicator

### Setup

#### 1. Configure Gluetun in docker-compose.yml

The included `docker-compose.yml` already has Gluetun configured. Key settings:

```yaml
gluetun:
  image: ghcr.io/qdm12/gluetun:latest
  environment:
    VPN_SERVICE_PROVIDER: protonvpn  # Change to your provider
    VPN_TYPE: openvpn
    OPENVPN_USER: ${OPENVPN_USER}
    OPENVPN_PASSWORD: ${OPENVPN_PASSWORD}
    VPN_PORT_FORWARDING: on
    SERVER_COUNTRIES: France,Netherlands  # Adjust to your preference
    PORT_FORWARD_ONLY: on
    HTTP_CONTROL_SERVER_ADDRESS: :8000
```

See [Gluetun Wiki](https://github.com/qdm12/gluetun-wiki) for provider-specific configuration.

#### 2. Configure Gluetun Authentication

Create `gluetun/auth/config.toml`:

```toml
[[roles]]
name = "transmission"
routes = [
    "GET /v1/portforward",
    "GET /v1/vpn/status",
    "GET /v1/publicip/ip",
    "GET /v1/dns/status",
    "GET /v1/vpn/settings"
]
auth = "apikey"
apikey = "your_secret_api_key"
```

#### 3. Configure Gluetun credentials

Add to your root `.env` file:

```env
GLUETUN_AUTH=apikey
GLUETUN_API_KEY=your_secret_api_key
```

These are automatically passed to the `transmission-monitor` container in docker-compose.

#### 4. Enable in transmission-ui

When building the UI, set the environment variable:

```bash
VITE_GLUETUN_ENABLED=true npm run build:ui
```

Or add to `packages/transmission-ui/.env`:

```env
VITE_GLUETUN_ENABLED=true
```

### Automatic Port Forwarding

The docker-compose configuration includes automatic port forwarding setup. When Gluetun receives a new port from the VPN provider, it automatically:
1. Updates Transmission's peer port
2. Reannounces all torrents to trackers

## 📡 API Reference

### transmission-monitor API

#### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/snapshots` | GET | Get historical statistics |
| `/gluetun/publicip` | GET | Get VPN public IP |
| `/gluetun/vpn/status` | GET | Get VPN connection status |
| `/gluetun/portforward` | GET | Get forwarded port |
| `/gluetun/dns/status` | GET | Get DNS status |

#### Query Parameters for /snapshots

| Parameter | Type | Description |
|-----------|------|-------------|
| `seconds` | number | Get last N seconds of data (max: 86400) |
| `from` | timestamp | Start timestamp (ms) |
| `to` | timestamp | End timestamp (ms) |

#### WebSocket

Connect to `ws://localhost:3000` for real-time updates.

Message format:
```json
{
  "timestamp": 1703500000000,
  "upload": 234567,
  "download": 1234567,
  "details": [
    {
      "torrent": "Example Torrent Name",
      "torrent_id": 1,
      "upload": 234567,
      "download": 1234567,
      "peers": [
        {
          "ip": "192.168.1.1",
          "port": 51413,
          "country": "US",
          "client": "qBittorrent/4.5.0",
          "downloadSpeed": 102400,
          "uploadSpeed": 51200,
          "isSeeder": true,
          "isDownloading": true,
          "isUploading": false
        }
      ]
    }
  ]
}
```

## 🛠️ Development

### Project Structure

```
shadmission/
├── packages/
│   ├── transmission-ui/      # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utility functions
│   │   │   └── pages/        # Page components
│   │   └── package.json
│   │
│   └── transmission-monitor/ # Node.js backend
│       ├── src/
│       │   ├── index.ts      # Express server
│       │   ├── monitor.ts    # Transmission polling
│       │   └── database.ts   # SQLite operations
│       └── package.json
│
├── gluetun/                  # Gluetun configuration
├── docker-compose.yml        # Docker services
├── turbo.json               # Turborepo config
└── package.json             # Root package.json
```

### Scripts

```bash
# Development
npm run dev           # Start all packages in dev mode
npm run dev:ui        # Start UI only
npm run dev:monitor   # Start monitor only

# Building
npm run build         # Build all packages
npm run build:ui      # Build UI only
npm run build:monitor # Build monitor only

# Linting
npm run lint          # Lint all packages
```

### Tech Stack

**Frontend (transmission-ui)**
- React 19
- TypeScript 5.9
- Vite 7
- Tailwind CSS 4
- shadcn/ui
- Recharts
- React Router 7
- TanStack Table

**Backend (transmission-monitor)**
- Node.js 22
- Express 5
- WebSocket (ws)
- better-sqlite3
- TypeScript

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Shadmission Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- [Transmission](https://transmissionbt.com/) - The awesome BitTorrent client
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Gluetun](https://github.com/qdm12/gluetun) - Lightweight VPN client
- [LinuxServer.io](https://www.linuxserver.io/) - Transmission Docker image

---

<div align="center">

Made with ❤️ by Arky

</div>
