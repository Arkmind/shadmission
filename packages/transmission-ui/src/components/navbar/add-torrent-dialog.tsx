import { client } from "@/lib/transmission";
import { IconPlus, IconUpload } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface SessionResponse {
  arguments: {
    "download-dir"?: string;
  };
}

export const AddTorrentDialog: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [torrentUrl, setTorrentUrl] = useState("");
  const [torrentFile, setTorrentFile] = useState<File | null>(null);
  const [downloadDir, setDownloadDir] = useState("");
  const [defaultDownloadDir, setDefaultDownloadDir] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch default download directory when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchDownloadDir = async () => {
      try {
        const response = await client.request<SessionResponse>("session-get", {
          fields: ["download-dir"],
        });
        const dir = response._data?.arguments["download-dir"] ?? "";
        setDefaultDownloadDir(dir);
        setDownloadDir(dir);
      } catch (error) {
        console.error("Failed to fetch download directory:", error);
      }
    };
    fetchDownloadDir();
  }, [open]);

  const resetForm = useCallback(() => {
    setTorrentUrl("");
    setTorrentFile(null);
    setDownloadDir(defaultDownloadDir);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [defaultDownloadDir]);

  const handleAddTorrent = useCallback(async () => {
    if (!torrentUrl.trim() && !torrentFile) {
      toast.error("Please enter a torrent URL/magnet link or select a file");
      return;
    }

    setIsAdding(true);
    try {
      const baseArgs = downloadDir ? { "download-dir": downloadDir } : {};

      if (torrentFile) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(torrentFile);
        });
        await client.request("torrent-add", { ...baseArgs, metainfo: base64 });
        toast.success(`Torrent "${torrentFile.name}" added successfully`);
      } else {
        await client.request("torrent-add", {
          ...baseArgs,
          filename: torrentUrl,
        });
        toast.success("Torrent added successfully");
      }
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Failed to add torrent:", error);
      toast.error("Failed to add torrent", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsAdding(false);
    }
  }, [torrentUrl, torrentFile, downloadDir, resetForm]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setTorrentFile(file);
        setTorrentUrl("");
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith(".torrent")) {
        setTorrentFile(file);
        setTorrentUrl("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error("Please drop a .torrent file");
      }
    }
  }, []);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            onClick={() => setOpen(true)}
          >
            <IconPlus className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Add Torrent</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-primary/10 border-2 border-dashed border-primary pointer-events-none">
              <div className="text-center">
                <IconUpload className="size-12 mx-auto mb-2 text-primary" />
                <p className="text-lg font-medium text-primary">
                  Drop .torrent file here
                </p>
              </div>
            </div>
          )}
          <DialogHeader>
            <DialogTitle>Add Torrent</DialogTitle>
            <DialogDescription>
              Enter a magnet link, torrent URL, or drag & drop a .torrent file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="torrent-file">Upload .torrent File</Label>
              <Input
                ref={fileInputRef}
                id="torrent-file"
                type="file"
                accept=".torrent"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className={`grid gap-2 ${
                  torrentFile ? "grid-cols-[1fr_auto]" : "grid-cols-1"
                }`}
              >
                <Button
                  type="button"
                  variant="outline"
                  className="overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconUpload className="size-4 shrink-0" />
                  <span className="truncate">
                    {torrentFile ? torrentFile.name : "Choose File"}
                  </span>
                </Button>
                {torrentFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTorrentFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="torrent-url">Magnet Link or URL</Label>
              <Input
                id="torrent-url"
                placeholder="magnet:?xt=urn:btih:... or https://..."
                value={torrentUrl}
                onChange={(e) => {
                  setTorrentUrl(e.target.value);
                  if (e.target.value) {
                    setTorrentFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTorrent();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="download-dir">Download Directory</Label>
              <Input
                id="download-dir"
                placeholder="/downloads/complete"
                value={downloadDir}
                onChange={(e) => setDownloadDir(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isAdding}
            >
              Cancel
            </Button>
            <Button onClick={handleAddTorrent} disabled={isAdding}>
              {isAdding ? "Adding..." : "Add Torrent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
