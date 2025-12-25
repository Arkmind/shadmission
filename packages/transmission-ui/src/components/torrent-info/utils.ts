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
    default:
      return "bg-gray-500";
  }
};
