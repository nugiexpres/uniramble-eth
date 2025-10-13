import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind classes conditionally
 * Example: cn("px-2", condition && "bg-red-500")
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format tx hash menjadi pendek, misal 0x1234...abcd
 */
export function formatHash(hash: string, length = 6) {
  if (!hash) return "";
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

/**
 * Format address menjadi pendek, misal 0x1234...abcd
 */
export function formatAddress(address: string, length = 6) {
  if (!address) return "";
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Format angka dengan koma (untuk gas, block, dll.)
 */
export function formatNumber(num: number | string) {
  if (num === null || num === undefined) return "";
  return Number(num).toLocaleString();
}

/**
 * Convert timestamp (detik) ke format waktu
 */
export function formatTimestamp(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
}
