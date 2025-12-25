import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/utils";
import { FileIcon, FolderIcon } from "lucide-react";
import { memo, type FC } from "react";
import type { RawTorrentData, TorrentTabProps } from "./types";

const getPriorityLabel = (priority: number): string => {
  switch (priority) {
    case -1:
      return "Low";
    case 0:
      return "Normal";
    case 1:
      return "High";
    default:
      return "Normal";
  }
};

const getPriorityColor = (priority: number): string => {
  switch (priority) {
    case -1:
      return "text-muted-foreground";
    case 1:
      return "text-orange-500";
    default:
      return "";
  }
};

export const FilesTab: FC<TorrentTabProps> = memo(
  ({ torrent }) => {
    const raw = torrent.raw as RawTorrentData;
    const files = raw?.files || [];
    const fileStats = raw?.fileStats || [];

    return (
      <ScrollArea className="h-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-24 text-right">Size</TableHead>
              <TableHead className="w-32">Progress</TableHead>
              <TableHead className="w-20">Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file, index) => {
              const stats = fileStats[index];
              const progress =
                file.length > 0 ? file.bytesCompleted / file.length : 0;
              const isFolder = file.name.includes("/");
              const fileName = file.name.split("/").pop() || file.name;

              return (
                <TableRow key={index}>
                  <TableCell>
                    {isFolder ? (
                      <FolderIcon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs" title={file.name}>
                    {fileName}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {formatBytes(file.length)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress * 100} className="h-2" />
                      <span className="text-xs text-muted-foreground w-10">
                        {(progress * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs ${getPriorityColor(
                        stats?.priority || 0
                      )}`}
                    >
                      {getPriorityLabel(stats?.priority || 0)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
            {files.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No files available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  },
  (prevProps, nextProps) => {
    const prevRaw = prevProps.torrent.raw as RawTorrentData;
    const nextRaw = nextProps.torrent.raw as RawTorrentData;
    return (
      JSON.stringify(prevRaw?.files) === JSON.stringify(nextRaw?.files) &&
      JSON.stringify(prevRaw?.fileStats) === JSON.stringify(nextRaw?.fileStats)
    );
  }
);

FilesTab.displayName = "FilesTab";
