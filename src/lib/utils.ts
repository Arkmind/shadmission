import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export const formatSpeed = (bytesPerSec: number): string => {
  return `${formatBytes(bytesPerSec)}/s`;
};

export const formatEta = (seconds: number): string => {
  if (seconds < 0) return "∞";
  if (seconds === 0) return "Done";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};
