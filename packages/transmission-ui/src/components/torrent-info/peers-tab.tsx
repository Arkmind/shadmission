import { Badge } from "@/components/ui/badge";
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
import { formatSpeed } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, LockIcon, UnlockIcon } from "lucide-react";
import { memo, type FC } from "react";
import type { RawTorrentData, TorrentTabProps } from "./types";

export const PeersTab: FC<TorrentTabProps> = memo(
  ({ torrent }) => {
    const raw = torrent.raw as RawTorrentData;
    const peers = raw?.peers || [];
    const peersFrom = raw?.peersFrom;

    return (
      <ScrollArea className="h-full">
        {peersFrom && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline">DHT: {peersFrom.fromDht}</Badge>
            <Badge variant="outline">PEX: {peersFrom.fromPex}</Badge>
            <Badge variant="outline">Tracker: {peersFrom.fromTracker}</Badge>
            <Badge variant="outline">Incoming: {peersFrom.fromIncoming}</Badge>
            <Badge variant="outline">Cache: {peersFrom.fromCache}</Badge>
            <Badge variant="outline">LPD: {peersFrom.fromLpd}</Badge>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="w-24">Progress</TableHead>
              <TableHead className="w-20 text-right">
                <ArrowDownIcon className="h-3 w-3 inline" />
              </TableHead>
              <TableHead className="w-20 text-right">
                <ArrowUpIcon className="h-3 w-3 inline" />
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {peers.map((peer, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono text-xs">
                  {peer.address}:{peer.port}
                </TableCell>
                <TableCell
                  className="text-xs max-w-32 truncate"
                  title={peer.clientName}
                >
                  {peer.clientName}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={peer.progress * 100}
                      className="h-2 w-16"
                    />
                    <span className="text-xs text-muted-foreground">
                      {(peer.progress * 100).toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs">
                  {peer.rateToClient > 0 && (
                    <span className="text-green-500">
                      {formatSpeed(peer.rateToClient)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {peer.rateToPeer > 0 && (
                    <span className="text-blue-500">
                      {formatSpeed(peer.rateToPeer)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {peer.isEncrypted ? (
                    <span title="Encrypted">
                      <LockIcon className="h-3 w-3 text-green-500" />
                    </span>
                  ) : (
                    <span title="Not encrypted">
                      <UnlockIcon className="h-3 w-3 text-muted-foreground" />
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {peers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No peers connected
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
      JSON.stringify(prevRaw?.peers) === JSON.stringify(nextRaw?.peers) &&
      JSON.stringify(prevRaw?.peersFrom) === JSON.stringify(nextRaw?.peersFrom)
    );
  }
);

PeersTab.displayName = "PeersTab";
