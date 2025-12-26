import {
  GraphSelectableProvider,
  SelectableChart,
  SelectionInfo,
  SelectionTorrentsList,
} from "@/components/graph-selectable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type React from "react";

export const GraphPage: React.FC = () => {
  return (
    <GraphSelectableProvider>
      <div className="grid grid-cols-1 xl:grid-cols-2 auto-rows-min xl:grid-rows-6 gap-3 h-full">
        {/* Main Graph - Full width top */}
        <Card className="rounded-xl xl:col-span-2 xl:row-span-4 py-0">
          <CardContent className="h-full p-2 px-4">
            <SelectableChart />
          </CardContent>
        </Card>

        {/* Torrents List - Bottom left */}
        <Card className="rounded-xl xl:row-span-2 p-4 px-6 min-h-50 xl:min-h-0 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">
              Active Torrents
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-3rem)] p-0">
            <SelectionTorrentsList />
          </CardContent>
        </Card>

        {/* Selection Info - Bottom right */}
        <Card className="rounded-xl xl:row-span-2 p-4 px-6 min-h-50 xl:min-h-0 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-sm font-medium">
              Selection Details
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-3rem)] p-0 overflow-hidden">
            <SelectionInfo />
          </CardContent>
        </Card>
      </div>
    </GraphSelectableProvider>
  );
};
