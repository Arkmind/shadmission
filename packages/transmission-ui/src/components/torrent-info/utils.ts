import {
  ArrowDownUp,
  Ban,
  CircleQuestionMark,
  Download,
  Pause,
  SearchCheck,
  Sprout,
  TriangleAlert,
} from "lucide-react";

export const formatDateString = (date: string | Date | undefined): string => {
  if (!date) return "N/A";
  return new Date(date).toLocaleString();
};

export const getStateColor = (state: string): string => {
  switch (state) {
    case "downloading":
      return "bg-blue-500";
    case "seeding":
      return "bg-green-500";
    case "paused":
      return "bg-yellow-500";
    case "checking":
      return "bg-purple-500";
    case "error":
      return "bg-red-500";
    case "queued":
      return "bg-orange-500";
    case "warning":
      return "bg-yellow-700";
    default:
      return "bg-gray-500";
  }
};

export const getStateIcon = (state: string) => {
  switch (state) {
    case "downloading":
      return Download;
    case "seeding":
      return Sprout;
    case "paused":
      return Pause;
    case "checking":
      return SearchCheck;
    case "error":
      return Ban;
    case "queued":
      return ArrowDownUp;
    case "warning":
      return TriangleAlert;
    default:
      return CircleQuestionMark;
  }
};
