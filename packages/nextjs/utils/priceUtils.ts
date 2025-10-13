// utils/priceUtils.ts
import { formatEther } from "viem";

/**
 * Format ETH price from wei to readable format
 * @param price Price in wei (bigint)
 * @returns Formatted price string
 */
export const formatEthPrice = (price: bigint | undefined): string => {
  if (!price || price === 0n) return "Free";
  return `${formatEther(price)}`;
};

/**
 * Format ETH price as number for calculations
 * @param price Price in wei (bigint)
 * @returns Price as number
 */
export const formatEthPriceAsNumber = (price: bigint | undefined): number => {
  if (!price || price === 0n) return 0;
  return Number(formatEther(price));
};

/**
 * Check if price is free (0 or undefined)
 * @param price Price in wei (bigint)
 * @returns Boolean indicating if price is free
 */
export const isFreePrice = (price: bigint | undefined): boolean => {
  return !price || price === 0n;
};
