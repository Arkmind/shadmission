import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { client } from "@/lib/transmission";
import { SaveIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState, type FC } from "react";
import { toast } from "sonner";
import type { RawTorrentData, TorrentTabProps } from "./types";

interface TorrentSettings {
  downloadDir: string;
  downloadLimit: number;
  downloadLimited: boolean;
  uploadLimit: number;
  uploadLimited: boolean;
  honorsSessionLimits: boolean;
  sequentialDownload: boolean;
  peerLimit: number;
  queuePosition: number;
  seedIdleMode: number;
  seedIdleLimit: number;
  seedRatioMode: number;
  seedRatioLimit: number;
}

export const ActionsTab: FC<TorrentTabProps> = memo(
  ({ torrent, onUpdate }) => {
    const raw = torrent.raw as RawTorrentData;
    const torrentId = raw?.id;

    // Settings state
    const [settings, setSettings] = useState<TorrentSettings>({
      downloadDir: raw?.downloadDir || "",
      downloadLimit: raw?.downloadLimit || 0,
      downloadLimited: raw?.downloadLimited || false,
      uploadLimit: raw?.uploadLimit || 0,
      uploadLimited: raw?.uploadLimited || false,
      honorsSessionLimits: raw?.honorsSessionLimits ?? true,
      sequentialDownload: raw?.sequentialDownload || false,
      peerLimit: raw?.["peer-limit"] || 50,
      queuePosition: raw?.queuePosition || 0,
      seedIdleMode: raw?.seedIdleMode || 0,
      seedIdleLimit: raw?.seedIdleLimit || 30,
      seedRatioMode: raw?.seedRatioMode || 0,
      seedRatioLimit: raw?.seedRatioLimit || 2,
    });

    const [saving, setSaving] = useState(false);

    // Fetch additional fields not included in getAllData
    // Missing from library: uploadLimit, uploadLimited, seedIdleMode, sequentialDownload
    const fetchAdditionalFields = useCallback(async () => {
      if (!torrentId) return;
      try {
        const result = await client.listTorrents(torrentId, [
          "uploadLimit",
          "uploadLimited",
          "seedIdleMode",
          "sequentialDownload",
        ]);
        const torrentData = result.arguments.torrents[0] as
          | ((typeof result.arguments.torrents)[0] & {
              uploadLimit?: number;
              uploadLimited?: boolean;
              seedIdleMode?: number;
              sequentialDownload?: boolean;
            })
          | undefined;
        if (torrentData) {
          setSettings((s) => ({
            ...s,
            uploadLimit: torrentData.uploadLimit ?? s.uploadLimit,
            uploadLimited: torrentData.uploadLimited ?? s.uploadLimited,
            seedIdleMode: torrentData.seedIdleMode ?? s.seedIdleMode,
            sequentialDownload:
              torrentData.sequentialDownload ?? s.sequentialDownload,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch additional torrent fields:", error);
      }
    }, [torrentId]);

    // Update state when torrent changes
    useEffect(() => {
      setSettings({
        downloadDir: raw?.downloadDir || "",
        downloadLimit: raw?.downloadLimit || 0,
        downloadLimited: raw?.downloadLimited || false,
        uploadLimit: raw?.uploadLimit || 0,
        uploadLimited: raw?.uploadLimited || false,
        honorsSessionLimits: raw?.honorsSessionLimits ?? true,
        sequentialDownload: raw?.sequentialDownload || false,
        peerLimit: raw?.["peer-limit"] || 50,
        queuePosition: raw?.queuePosition || 0,
        seedIdleMode: raw?.seedIdleMode || 0,
        seedIdleLimit: raw?.seedIdleLimit || 30,
        seedRatioMode: raw?.seedRatioMode || 0,
        seedRatioLimit: raw?.seedRatioLimit || 2,
      });
    }, [raw]);

    useEffect(() => {
      fetchAdditionalFields();
    }, [torrentId]);

    const handleSaveSettings = async () => {
      if (!torrentId) return;
      setSaving(true);
      try {
        await client.request("torrent-set", {
          ids: [torrentId],
          downloadLimit: settings.downloadLimit,
          downloadLimited: settings.downloadLimited,
          uploadLimit: settings.uploadLimit,
          uploadLimited: settings.uploadLimited,
          honorsSessionLimits: settings.honorsSessionLimits,
          sequentialDownload: settings.sequentialDownload,
          "peer-limit": settings.peerLimit,
          queuePosition: settings.queuePosition,
          seedIdleMode: settings.seedIdleMode,
          seedIdleLimit: settings.seedIdleLimit,
          seedRatioMode: settings.seedRatioMode,
          seedRatioLimit: settings.seedRatioLimit,
        });

        // Update location separately if changed
        if (settings.downloadDir !== raw?.downloadDir) {
          await client.request("torrent-set-location", {
            ids: [torrentId],
            location: settings.downloadDir,
            move: true,
          });
        }

        toast.success("Settings saved", {
          description: "Torrent settings have been updated successfully.",
        });

        onUpdate?.();
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast.error("Failed to save settings", {
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      } finally {
        setSaving(false);
      }
    };

    return (
      <ScrollArea className="h-full pr-4">
        <div className="space-y-6">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="downloadDir">Download Location</Label>
            <Input
              id="downloadDir"
              value={settings.downloadDir}
              onChange={(e) =>
                setSettings((s) => ({ ...s, downloadDir: e.target.value }))
              }
              placeholder="/downloads"
            />
          </div>

          <Separator />

          {/* Speed Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Speed Limits</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="downloadLimit">Download Limit (KB/s)</Label>
                  <Switch
                    checked={settings.downloadLimited}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, downloadLimited: checked }))
                    }
                  />
                </div>
                <Input
                  id="downloadLimit"
                  type="number"
                  min={0}
                  disabled={!settings.downloadLimited}
                  value={settings.downloadLimit}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      downloadLimit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="uploadLimit">Upload Limit (KB/s)</Label>
                  <Switch
                    checked={settings.uploadLimited}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({ ...s, uploadLimited: checked }))
                    }
                  />
                </div>
                <Input
                  id="uploadLimit"
                  type="number"
                  min={0}
                  disabled={!settings.uploadLimited}
                  value={settings.uploadLimit}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      uploadLimit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="honorsSessionLimits">Honor Session Limits</Label>
              <Switch
                id="honorsSessionLimits"
                checked={settings.honorsSessionLimits}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, honorsSessionLimits: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Download Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Download Settings</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="sequentialDownload">Download Sequentially</Label>
              <Switch
                id="sequentialDownload"
                checked={settings.sequentialDownload}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({ ...s, sequentialDownload: checked }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="peerLimit">Maximum Peers</Label>
                <Input
                  id="peerLimit"
                  type="number"
                  min={1}
                  max={500}
                  value={settings.peerLimit}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      peerLimit: parseInt(e.target.value) || 50,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="queuePosition">Queue Position</Label>
                <Input
                  id="queuePosition"
                  type="number"
                  min={0}
                  value={settings.queuePosition}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      queuePosition: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Seeding Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Seeding Settings</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seedIdleMode">Seed Idle Mode</Label>
                <Select
                  value={settings.seedIdleMode.toString()}
                  onValueChange={(value) =>
                    setSettings((s) => ({
                      ...s,
                      seedIdleMode: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger id="seedIdleMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Global Settings</SelectItem>
                    <SelectItem value="1">Custom</SelectItem>
                    <SelectItem value="2">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.seedIdleMode === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="seedIdleLimit">Seed Idle Limit (min)</Label>
                  <Input
                    id="seedIdleLimit"
                    type="number"
                    min={1}
                    value={settings.seedIdleLimit}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        seedIdleLimit: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seedRatioMode">Seed Ratio Mode</Label>
                <Select
                  value={settings.seedRatioMode.toString()}
                  onValueChange={(value) =>
                    setSettings((s) => ({
                      ...s,
                      seedRatioMode: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger id="seedRatioMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Global Settings</SelectItem>
                    <SelectItem value="1">Custom</SelectItem>
                    <SelectItem value="2">Unlimited</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.seedRatioMode === 1 && (
                <div className="space-y-2">
                  <Label htmlFor="seedRatioLimit">Seed Ratio Limit</Label>
                  <Input
                    id="seedRatioLimit"
                    type="number"
                    min={0}
                    step={0.1}
                    value={settings.seedRatioLimit}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        seedRatioLimit: parseFloat(e.target.value) || 2,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full"
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </ScrollArea>
    );
  },
  (prevProps, nextProps) => {
    const prevRaw = prevProps.torrent.raw as RawTorrentData;
    const nextRaw = nextProps.torrent.raw as RawTorrentData;
    // ActionsTab mostly uses static settings, only re-render if torrent id changes or key settings change
    return (
      prevRaw?.id === nextRaw?.id &&
      prevRaw?.downloadDir === nextRaw?.downloadDir &&
      prevRaw?.downloadLimit === nextRaw?.downloadLimit &&
      prevRaw?.downloadLimited === nextRaw?.downloadLimited &&
      prevRaw?.uploadLimit === nextRaw?.uploadLimit &&
      prevRaw?.uploadLimited === nextRaw?.uploadLimited
    );
  }
);

ActionsTab.displayName = "ActionsTab";
