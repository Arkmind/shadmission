import Transmission from "@ctrl/transmission";

export interface TransferStats {
  timestamp: number;
  downloadSpeed: number;
  uploadSpeed: number;
  totalDownloaded: number;
  totalUploaded: number;
  activeTorrents: number;
  pausedTorrents: number;
  totalTorrents: number;
}

export interface TorrentInfo {
  id: number;
  name: string;
  status: number;
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  totalSize: number;
  downloadedEver: number;
  uploadedEver: number;
  eta: number;
  uploadRatio: number;
  addedDate: number;
}

export interface MonitorConfig {
  url: string;
  username: string;
  password: string;
  pollInterval: number;
  historySize?: number;
}

type Subscriber = (data: TransferStats) => void;

export class TransmissionMonitor {
  private client: Transmission;
  private pollInterval: number;
  private historySize: number;
  private history: TransferStats[] = [];
  private subscribers: Set<Subscriber> = new Set();
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: MonitorConfig) {
    this.client = new Transmission({
      baseUrl: config.url,
      username: config.username,
      password: config.password,
    });
    this.pollInterval = config.pollInterval;
    this.historySize = config.historySize || 3600; // 1 hour of history at 1s intervals
  }

  async getStats(): Promise<TransferStats> {
    const session = await this.client.sessionStats();
    const torrents = await this.client.listTorrents();

    const activeTorrents = torrents.torrents.filter(
      (t) => t.status === 4 || t.status === 6
    ).length;
    const pausedTorrents = torrents.torrents.filter(
      (t) => t.status === 0
    ).length;

    return {
      timestamp: Date.now(),
      downloadSpeed: session.result["download-speed"] || 0,
      uploadSpeed: session.result["upload-speed"] || 0,
      totalDownloaded: session.result["current-stats"]?.downloadedBytes || 0,
      totalUploaded: session.result["current-stats"]?.uploadedBytes || 0,
      activeTorrents,
      pausedTorrents,
      totalTorrents: torrents.torrents.length,
    };
  }

  async getTorrents(): Promise<TorrentInfo[]> {
    const response = await this.client.listTorrents();

    return response.torrents.map((t) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      percentDone: t.percentDone,
      rateDownload: t.rateDownload,
      rateUpload: t.rateUpload,
      totalSize: t.totalSize,
      downloadedEver: t.downloadedEver,
      uploadedEver: t.uploadedEver,
      eta: t.eta,
      uploadRatio: t.uploadRatio,
      addedDate: t.addedDate,
    }));
  }

  getHistory(): TransferStats[] {
    return [...this.history];
  }

  subscribe(callback: Subscriber): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify(data: TransferStats): void {
    for (const subscriber of this.subscribers) {
      subscriber(data);
    }
  }

  private async poll(): Promise<void> {
    try {
      const stats = await this.getStats();

      // Add to history
      this.history.push(stats);
      if (this.history.length > this.historySize) {
        this.history.shift();
      }

      // Notify subscribers
      this.notify(stats);
    } catch (error) {
      console.error("Error polling Transmission:", error);
    }
  }

  start(): void {
    if (this.intervalId) return;
    console.log(`Starting monitor with ${this.pollInterval}ms interval`);
    this.poll(); // Initial poll
    this.intervalId = setInterval(() => this.poll(), this.pollInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Monitor stopped");
    }
  }
}
