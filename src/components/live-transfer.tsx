import { ArrowDown, ArrowUp } from "lucide-react";
import { type FC } from "react";

export interface LiveTransferProps {}

export const LiveTransfer: FC<LiveTransferProps> = () => {
  return (
    <div className="flex justify-evenly space-x-16">
      <div className="flex items-center">
        <ArrowUp></ArrowUp>
        <h1>1</h1>
        <span className="ml-1 text-xl font-light">B/s</span>
      </div>
      <div className="flex items-center">
        <ArrowDown></ArrowDown>
        <h1>1</h1>
        <span className="ml-1 text-xl font-light">B/s</span>
      </div>
    </div>
  );
};
