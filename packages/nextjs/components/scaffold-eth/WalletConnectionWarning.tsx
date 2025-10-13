"use client";

import { AlertTriangle, Wallet } from "lucide-react";
import { useAccount } from "wagmi";

interface WalletConnectionWarningProps {
  message?: string;
  className?: string;
}

/**
 * Component to show wallet connection warning instead of individual connect buttons
 * All wallet connections should be centralized to the header
 */
export const WalletConnectionWarning = ({
  message = "Connect wallet",
  className = "",
}: WalletConnectionWarningProps) => {
  const { isConnected } = useAccount();

  // Don't show warning if wallet is already connected
  if (isConnected) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-center p-6 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-orange-400" />
          <Wallet className="w-6 h-6 text-orange-400" />
        </div>
        <div className="text-center">
          <p className="text-orange-300 font-bold text-lg">{message}</p>
          <p className="text-orange-400/70 text-sm mt-1">Please connect your wallet</p>
        </div>
      </div>
    </div>
  );
};
