import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { client } from "@/lib/transmission";
import {
  IconBan,
  IconDeviceFloppy,
  IconDownload,
  IconLoader2,
  IconNetwork,
  IconRefresh,
  IconServer,
  IconUpload,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface SessionSettings {
  // Directories
  "download-dir": string;
  "incomplete-dir": string;
  "incomplete-dir-enabled": boolean;

  // Speed limits
  "speed-limit-down": number;
  "speed-limit-down-enabled": boolean;
  "speed-limit-up": number;
  "speed-limit-up-enabled": boolean;

  // Alt speed (turtle mode)
  "alt-speed-down": number;
  "alt-speed-up": number;
  "alt-speed-enabled": boolean;
  "alt-speed-time-enabled": boolean;
  "alt-speed-time-begin": number;
  "alt-speed-time-end": number;
  "alt-speed-time-day": number;

  // Queue settings
  "download-queue-enabled": boolean;
  "download-queue-size": number;
  "seed-queue-enabled": boolean;
  "seed-queue-size": number;
  "queue-stalled-enabled": boolean;
  "queue-stalled-minutes": number;

  // Seeding
  seedRatioLimit: number;
  seedRatioLimited: boolean;
  "idle-seeding-limit": number;
  "idle-seeding-limit-enabled": boolean;

  // Peers
  "peer-limit-global": number;
  "peer-limit-per-torrent": number;
  "peer-port": number;
  "peer-port-random-on-start": boolean;

  // Network
  "dht-enabled": boolean;
  "pex-enabled": boolean;
  "lpd-enabled": boolean;
  "utp-enabled": boolean;
  "port-forwarding-enabled": boolean;
  encryption: string;

  // Blocklist
  "blocklist-enabled": boolean;
  "blocklist-url": string;
  "blocklist-size": number;

  // Misc
  "start-added-torrents": boolean;
  "rename-partial-files": boolean;
  "trash-original-torrent-files": boolean;
  "cache-size-mb": number;

  // Scripts
  "script-torrent-done-enabled": boolean;
  "script-torrent-done-filename": string;

  // Read-only info
  version: string;
  "rpc-version": number;
  "config-dir": string;
  "download-dir-free-space": number;
}

interface SessionResponse {
  arguments: SessionSettings;
}

const SESSION_FIELDS = [
  "download-dir",
  "incomplete-dir",
  "incomplete-dir-enabled",
  "speed-limit-down",
  "speed-limit-down-enabled",
  "speed-limit-up",
  "speed-limit-up-enabled",
  "alt-speed-down",
  "alt-speed-up",
  "alt-speed-enabled",
  "alt-speed-time-enabled",
  "alt-speed-time-begin",
  "alt-speed-time-end",
  "alt-speed-time-day",
  "download-queue-enabled",
  "download-queue-size",
  "seed-queue-enabled",
  "seed-queue-size",
  "queue-stalled-enabled",
  "queue-stalled-minutes",
  "seedRatioLimit",
  "seedRatioLimited",
  "idle-seeding-limit",
  "idle-seeding-limit-enabled",
  "peer-limit-global",
  "peer-limit-per-torrent",
  "peer-port",
  "peer-port-random-on-start",
  "dht-enabled",
  "pex-enabled",
  "lpd-enabled",
  "utp-enabled",
  "port-forwarding-enabled",
  "encryption",
  "blocklist-enabled",
  "blocklist-url",
  "blocklist-size",
  "start-added-torrents",
  "rename-partial-files",
  "trash-original-torrent-files",
  "cache-size-mb",
  "script-torrent-done-enabled",
  "script-torrent-done-filename",
  "version",
  "rpc-version",
  "config-dir",
  "download-dir-free-space",
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SessionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] =
    useState<SessionSettings | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await client.request<SessionResponse>("session-get", {
        fields: SESSION_FIELDS,
      });
      const data = response._data?.arguments;
      if (data) {
        setSettings(data);
        setOriginalSettings(data);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = <K extends keyof SessionSettings>(
    key: K,
    value: SessionSettings[K]
  ) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    if (!settings || !originalSettings) return;

    setSaving(true);
    try {
      // Only send changed settings
      const changedSettings: Partial<SessionSettings> = {};
      for (const key of Object.keys(settings) as (keyof SessionSettings)[]) {
        // Skip read-only fields
        if (
          [
            "version",
            "rpc-version",
            "config-dir",
            "download-dir-free-space",
            "blocklist-size",
          ].includes(key)
        ) {
          continue;
        }
        if (settings[key] !== originalSettings[key]) {
          (changedSettings as Record<string, unknown>)[key] = settings[key];
        }
      }

      if (Object.keys(changedSettings).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await client.request("session-set", changedSettings);
      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateBlocklist = async () => {
    try {
      toast.info("Updating blocklist...");
      await client.request("blocklist-update", {});
      toast.success("Blocklist updated");
      fetchSettings();
    } catch (error) {
      console.error("Failed to update blocklist:", error);
      toast.error("Failed to update blocklist");
    }
  };

  if (loading) {
    return (
      <Card className="rounded-xl h-full flex items-center justify-center">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card className="rounded-xl h-full flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load settings</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl h-full flex flex-col py-0 overflow-hidden gap-0">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <CardTitle className="text-lg font-semibold">Settings</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettings}
            disabled={loading}
          >
            <IconRefresh className="size-4 mr-1" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={saveSettings}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <IconLoader2 className="size-4 mr-1 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 mt-0 overflow-hidden">
        <Tabs defaultValue="downloads" className="h-full flex flex-col px-3">
          <div className="">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="downloads">
                <IconDownload className="size-4 mr-1" />
                Downloads
              </TabsTrigger>
              <TabsTrigger value="speed">
                <IconUpload className="size-4 mr-1" />
                Speed
              </TabsTrigger>
              <TabsTrigger value="network">
                <IconNetwork className="size-4 mr-1" />
                Network
              </TabsTrigger>
              <TabsTrigger value="blocklist">
                <IconBan className="size-4 mr-1" />
                Blocklist
              </TabsTrigger>
              <TabsTrigger value="server">
                <IconServer className="size-4 mr-1" />
                Server
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            {/* Downloads Tab */}
            <TabsContent value="downloads" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Directories */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Directories</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="download-dir">Download Directory</Label>
                        <Input
                          id="download-dir"
                          value={settings["download-dir"]}
                          onChange={(e) =>
                            updateSetting("download-dir", e.target.value)
                          }
                          placeholder="/downloads"
                        />
                        <p className="text-xs text-muted-foreground">
                          Free space:{" "}
                          {formatBytes(settings["download-dir-free-space"])}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="incomplete-dir-enabled">
                            Use Incomplete Directory
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Keep incomplete downloads in a separate folder
                          </p>
                        </div>
                        <Switch
                          id="incomplete-dir-enabled"
                          checked={settings["incomplete-dir-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("incomplete-dir-enabled", checked)
                          }
                        />
                      </div>

                      {settings["incomplete-dir-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="incomplete-dir">
                            Incomplete Directory
                          </Label>
                          <Input
                            id="incomplete-dir"
                            value={settings["incomplete-dir"]}
                            onChange={(e) =>
                              updateSetting("incomplete-dir", e.target.value)
                            }
                            placeholder="/downloads/incomplete"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Queue Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Queue Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="download-queue-enabled">
                            Limit Download Queue
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Limit how many torrents download at once
                          </p>
                        </div>
                        <Switch
                          id="download-queue-enabled"
                          checked={settings["download-queue-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("download-queue-enabled", checked)
                          }
                        />
                      </div>

                      {settings["download-queue-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="download-queue-size">
                            Max Downloads
                          </Label>
                          <Input
                            id="download-queue-size"
                            type="number"
                            min={1}
                            value={settings["download-queue-size"]}
                            onChange={(e) =>
                              updateSetting(
                                "download-queue-size",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="seed-queue-enabled">
                            Limit Seed Queue
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Limit how many torrents seed at once
                          </p>
                        </div>
                        <Switch
                          id="seed-queue-enabled"
                          checked={settings["seed-queue-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("seed-queue-enabled", checked)
                          }
                        />
                      </div>

                      {settings["seed-queue-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="seed-queue-size">Max Seeds</Label>
                          <Input
                            id="seed-queue-size"
                            type="number"
                            min={1}
                            value={settings["seed-queue-size"]}
                            onChange={(e) =>
                              updateSetting(
                                "seed-queue-size",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="queue-stalled-enabled">
                            Consider Stalled Torrents
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Don't count idle torrents against queue limits
                          </p>
                        </div>
                        <Switch
                          id="queue-stalled-enabled"
                          checked={settings["queue-stalled-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("queue-stalled-enabled", checked)
                          }
                        />
                      </div>

                      {settings["queue-stalled-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="queue-stalled-minutes">
                            Stalled After (minutes)
                          </Label>
                          <Input
                            id="queue-stalled-minutes"
                            type="number"
                            min={1}
                            value={settings["queue-stalled-minutes"]}
                            onChange={(e) =>
                              updateSetting(
                                "queue-stalled-minutes",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Seeding Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Seeding Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="seedRatioLimited">
                            Stop at Ratio
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Stop seeding when reaching this ratio
                          </p>
                        </div>
                        <Switch
                          id="seedRatioLimited"
                          checked={settings.seedRatioLimited}
                          onCheckedChange={(checked) =>
                            updateSetting("seedRatioLimited", checked)
                          }
                        />
                      </div>

                      {settings.seedRatioLimited && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="seedRatioLimit">Seed Ratio</Label>
                          <Input
                            id="seedRatioLimit"
                            type="number"
                            min={0}
                            step={0.1}
                            value={settings.seedRatioLimit}
                            onChange={(e) =>
                              updateSetting(
                                "seedRatioLimit",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="idle-seeding-limit-enabled">
                            Stop When Idle
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Stop seeding when inactive for a period
                          </p>
                        </div>
                        <Switch
                          id="idle-seeding-limit-enabled"
                          checked={settings["idle-seeding-limit-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("idle-seeding-limit-enabled", checked)
                          }
                        />
                      </div>

                      {settings["idle-seeding-limit-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="idle-seeding-limit">
                            Idle Limit (minutes)
                          </Label>
                          <Input
                            id="idle-seeding-limit"
                            type="number"
                            min={1}
                            value={settings["idle-seeding-limit"]}
                            onChange={(e) =>
                              updateSetting(
                                "idle-seeding-limit",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-24"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Misc Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Behavior Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="start-added-torrents">
                            Start Added Torrents
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically start new torrents
                          </p>
                        </div>
                        <Switch
                          id="start-added-torrents"
                          checked={settings["start-added-torrents"]}
                          onCheckedChange={(checked) =>
                            updateSetting("start-added-torrents", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="rename-partial-files">
                            Rename Partial Files
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Add ".part" extension to incomplete files
                          </p>
                        </div>
                        <Switch
                          id="rename-partial-files"
                          checked={settings["rename-partial-files"]}
                          onCheckedChange={(checked) =>
                            updateSetting("rename-partial-files", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="trash-original-torrent-files">
                            Delete Torrent Files
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Remove .torrent files after adding
                          </p>
                        </div>
                        <Switch
                          id="trash-original-torrent-files"
                          checked={settings["trash-original-torrent-files"]}
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "trash-original-torrent-files",
                              checked
                            )
                          }
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Speed Tab */}
            <TabsContent value="speed" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Normal Speed Limits */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Speed Limits (KB/s)
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="speed-limit-down-enabled">
                            Limit Download Speed
                          </Label>
                        </div>
                        <Switch
                          id="speed-limit-down-enabled"
                          checked={settings["speed-limit-down-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("speed-limit-down-enabled", checked)
                          }
                        />
                      </div>

                      {settings["speed-limit-down-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="speed-limit-down">
                            Download Limit (KB/s)
                          </Label>
                          <Input
                            id="speed-limit-down"
                            type="number"
                            min={0}
                            value={settings["speed-limit-down"]}
                            onChange={(e) =>
                              updateSetting(
                                "speed-limit-down",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-32"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="speed-limit-up-enabled">
                            Limit Upload Speed
                          </Label>
                        </div>
                        <Switch
                          id="speed-limit-up-enabled"
                          checked={settings["speed-limit-up-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("speed-limit-up-enabled", checked)
                          }
                        />
                      </div>

                      {settings["speed-limit-up-enabled"] && (
                        <div className="space-y-2 ml-4">
                          <Label htmlFor="speed-limit-up">
                            Upload Limit (KB/s)
                          </Label>
                          <Input
                            id="speed-limit-up"
                            type="number"
                            min={0}
                            value={settings["speed-limit-up"]}
                            onChange={(e) =>
                              updateSetting(
                                "speed-limit-up",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  </section>

                  <Separator />

                  {/* Alternative Speed */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Alternative Speed (Turtle Mode)
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="alt-speed-enabled">
                            Enable Turtle Mode
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Use reduced speed limits
                          </p>
                        </div>
                        <Switch
                          id="alt-speed-enabled"
                          checked={settings["alt-speed-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("alt-speed-enabled", checked)
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="alt-speed-down">
                            Alt Download (KB/s)
                          </Label>
                          <Input
                            id="alt-speed-down"
                            type="number"
                            min={0}
                            value={settings["alt-speed-down"]}
                            onChange={(e) =>
                              updateSetting(
                                "alt-speed-down",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="alt-speed-up">
                            Alt Upload (KB/s)
                          </Label>
                          <Input
                            id="alt-speed-up"
                            type="number"
                            min={0}
                            value={settings["alt-speed-up"]}
                            onChange={(e) =>
                              updateSetting(
                                "alt-speed-up",
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="alt-speed-time-enabled">
                            Scheduled Times
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically enable at specific times
                          </p>
                        </div>
                        <Switch
                          id="alt-speed-time-enabled"
                          checked={settings["alt-speed-time-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("alt-speed-time-enabled", checked)
                          }
                        />
                      </div>

                      {settings["alt-speed-time-enabled"] && (
                        <div className="grid grid-cols-2 gap-4 ml-4">
                          <div className="space-y-2">
                            <Label htmlFor="alt-speed-time-begin">
                              Start Time
                            </Label>
                            <Input
                              id="alt-speed-time-begin"
                              type="time"
                              value={minutesToTime(
                                settings["alt-speed-time-begin"]
                              )}
                              onChange={(e) =>
                                updateSetting(
                                  "alt-speed-time-begin",
                                  timeToMinutes(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alt-speed-time-end">End Time</Label>
                            <Input
                              id="alt-speed-time-end"
                              type="time"
                              value={minutesToTime(
                                settings["alt-speed-time-end"]
                              )}
                              onChange={(e) =>
                                updateSetting(
                                  "alt-speed-time-end",
                                  timeToMinutes(e.target.value)
                                )
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Network Tab */}
            <TabsContent value="network" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Peer Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Peer Settings</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="peer-limit-global">
                            Global Peer Limit
                          </Label>
                          <Input
                            id="peer-limit-global"
                            type="number"
                            min={1}
                            value={settings["peer-limit-global"]}
                            onChange={(e) =>
                              updateSetting(
                                "peer-limit-global",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="peer-limit-per-torrent">
                            Peers Per Torrent
                          </Label>
                          <Input
                            id="peer-limit-per-torrent"
                            type="number"
                            min={1}
                            value={settings["peer-limit-per-torrent"]}
                            onChange={(e) =>
                              updateSetting(
                                "peer-limit-per-torrent",
                                parseInt(e.target.value) || 1
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Port Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Port Settings</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="peer-port">Peer Port</Label>
                        <Input
                          id="peer-port"
                          type="number"
                          min={1}
                          max={65535}
                          value={settings["peer-port"]}
                          onChange={(e) =>
                            updateSetting(
                              "peer-port",
                              parseInt(e.target.value) || 51413
                            )
                          }
                          className="w-32"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="peer-port-random-on-start">
                            Random Port on Start
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Pick a random port when Transmission starts
                          </p>
                        </div>
                        <Switch
                          id="peer-port-random-on-start"
                          checked={settings["peer-port-random-on-start"]}
                          onCheckedChange={(checked) =>
                            updateSetting("peer-port-random-on-start", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="port-forwarding-enabled">
                            Port Forwarding (UPnP)
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically forward port on router
                          </p>
                        </div>
                        <Switch
                          id="port-forwarding-enabled"
                          checked={settings["port-forwarding-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("port-forwarding-enabled", checked)
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Protocol Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Protocol Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="dht-enabled">DHT</Label>
                          <p className="text-xs text-muted-foreground">
                            Distributed Hash Table for finding peers
                          </p>
                        </div>
                        <Switch
                          id="dht-enabled"
                          checked={settings["dht-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("dht-enabled", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="pex-enabled">PEX</Label>
                          <p className="text-xs text-muted-foreground">
                            Peer Exchange for sharing peer lists
                          </p>
                        </div>
                        <Switch
                          id="pex-enabled"
                          checked={settings["pex-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("pex-enabled", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="lpd-enabled">LPD</Label>
                          <p className="text-xs text-muted-foreground">
                            Local Peer Discovery on your network
                          </p>
                        </div>
                        <Switch
                          id="lpd-enabled"
                          checked={settings["lpd-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("lpd-enabled", checked)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="utp-enabled">µTP</Label>
                          <p className="text-xs text-muted-foreground">
                            Micro Transport Protocol for congestion control
                          </p>
                        </div>
                        <Switch
                          id="utp-enabled"
                          checked={settings["utp-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("utp-enabled", checked)
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Encryption */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Encryption</h3>
                    <div className="space-y-2">
                      <Label htmlFor="encryption">Encryption Mode</Label>
                      <select
                        id="encryption"
                        value={settings.encryption}
                        onChange={(e) =>
                          updateSetting("encryption", e.target.value)
                        }
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="required">Required</option>
                        <option value="preferred">Preferred</option>
                        <option value="tolerated">Tolerated</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Required: Only connect to encrypted peers
                        <br />
                        Preferred: Prefer encrypted connections
                        <br />
                        Tolerated: Accept unencrypted connections
                      </p>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Blocklist Tab */}
            <TabsContent value="blocklist" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Blocklist Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="blocklist-enabled">
                            Enable Blocklist
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Block connections from known bad peers
                          </p>
                        </div>
                        <Switch
                          id="blocklist-enabled"
                          checked={settings["blocklist-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting("blocklist-enabled", checked)
                          }
                        />
                      </div>

                      {settings["blocklist-enabled"] && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="blocklist-url">Blocklist URL</Label>
                            <Input
                              id="blocklist-url"
                              value={settings["blocklist-url"]}
                              onChange={(e) =>
                                updateSetting("blocklist-url", e.target.value)
                              }
                              placeholder="https://example.com/blocklist.gz"
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                              Current rules:{" "}
                              {settings["blocklist-size"].toLocaleString()}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={updateBlocklist}
                            >
                              <IconRefresh className="size-4 mr-1" />
                              Update Blocklist
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Server Tab */}
            <TabsContent value="server" className="h-full m-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-6">
                  {/* Server Info */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Server Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version</span>
                        <span>{settings.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          RPC Version
                        </span>
                        <span>{settings["rpc-version"]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Config Directory
                        </span>
                        <span className="font-mono text-xs">
                          {settings["config-dir"]}
                        </span>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Cache Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">Cache Settings</h3>
                    <div className="space-y-2">
                      <Label htmlFor="cache-size-mb">Cache Size (MB)</Label>
                      <Input
                        id="cache-size-mb"
                        type="number"
                        min={1}
                        value={settings["cache-size-mb"]}
                        onChange={(e) =>
                          updateSetting(
                            "cache-size-mb",
                            parseInt(e.target.value) || 4
                          )
                        }
                        className="w-32"
                      />
                      <p className="text-xs text-muted-foreground">
                        Disk cache for reading and writing torrent data
                      </p>
                    </div>
                  </section>

                  <Separator />

                  {/* Script Settings */}
                  <section>
                    <h3 className="text-sm font-medium mb-3">
                      Completion Script
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="script-torrent-done-enabled">
                            Run Script on Completion
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Execute a script when a torrent finishes
                          </p>
                        </div>
                        <Switch
                          id="script-torrent-done-enabled"
                          checked={settings["script-torrent-done-enabled"]}
                          onCheckedChange={(checked) =>
                            updateSetting(
                              "script-torrent-done-enabled",
                              checked
                            )
                          }
                        />
                      </div>

                      {settings["script-torrent-done-enabled"] && (
                        <div className="space-y-2">
                          <Label htmlFor="script-torrent-done-filename">
                            Script Path
                          </Label>
                          <Input
                            id="script-torrent-done-filename"
                            value={settings["script-torrent-done-filename"]}
                            onChange={(e) =>
                              updateSetting(
                                "script-torrent-done-filename",
                                e.target.value
                              )
                            }
                            placeholder="/path/to/script.sh"
                          />
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};
