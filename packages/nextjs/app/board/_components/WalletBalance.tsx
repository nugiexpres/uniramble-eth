import React, { useState } from "react";
import { useTbaBalance } from "~~/hooks/tba/useTbaBalance";

export const WalletBalance: React.FC = () => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { userAddress, tbaAddress, balanceInfo, isTbaReady } = useTbaBalance();

  const copyToClipboard = async (address: string, type: "EOA" | "TBA") => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(type);
      setTimeout(() => setCopiedAddress(null), 1500);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-3)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num < 0.001 ? num.toExponential(2) : num.toFixed(3);
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-cyan-400/30 rounded-2xl shadow-2xl shadow-cyan-500/20 p-3 font-mono">
      {/* Gamer Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold text-cyan-400 tracking-wider">WALLET</span>
        </div>
        <div className="text-xs text-gray-400 font-mono">█▌</div>
      </div>

      {/* Compact Wallet Container */}
      <div className="bg-black/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-2 space-y-2">
        {/* EOA Section - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-black bg-gradient-to-r from-orange-400 to-yellow-500 px-2 py-1 rounded-md">
              MAIN
            </span>
            <span className="text-xs text-gray-300 truncate font-mono">
              {userAddress ? truncateAddress(userAddress) : "OFFLINE"}
            </span>
            {userAddress && (
              <button
                onClick={() => copyToClipboard(userAddress, "EOA")}
                className="text-xs hover:text-orange-400 transition-colors text-gray-500"
                title="Copy address"
              >
                {copiedAddress === "EOA" ? "⚡" : "📎"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-bold text-orange-400">
                {userAddress ? `${formatBalance(balanceInfo.wallet.balance)}` : "-.--"}
              </div>
              <div className="text-[10px] text-gray-500">ETH</div>
            </div>

            <button
              disabled
              className="px-2 py-1 text-[10px] bg-gradient-to-r from-gray-700 to-gray-800 text-blue-800 rounded-md border border-gray-600 cursor-not-allowed hover:border-gray-500 transition-all"
              title="🚀 Feature Loading..."
            >
              ▶ SEND
            </button>
          </div>
        </div>

        {/* Cyber Divider */}
        <div className="border-t border-gray-700/50 relative">
          <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
          </div>
        </div>

        {/* TBA Section - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-[10px] font-bold text-black bg-gradient-to-r from-blue-400 to-cyan-500 px-2 py-1 rounded-md">
              TBA
            </span>
            <span className="text-xs text-gray-300 truncate font-mono">
              {tbaAddress && isTbaReady ? truncateAddress(tbaAddress) : "NOT_INIT"}
            </span>
            {tbaAddress && isTbaReady && (
              <button
                onClick={() => copyToClipboard(tbaAddress, "TBA")}
                className="text-xs hover:text-cyan-400 transition-colors text-gray-500"
                title="Copy address"
              >
                {copiedAddress === "TBA" ? "⚡" : "📎"}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-sm font-bold text-cyan-400">
                {tbaAddress && isTbaReady ? `${formatBalance(balanceInfo.tba.balance)}` : "-.--"}
              </div>
              <div className="text-[10px] text-gray-500">ETH</div>
            </div>

            <button
              disabled
              className="px-2 py-1 text-[10px] bg-gradient-to-r from-gray-700 to-gray-800 text-blue-800 rounded-md border border-gray-600 cursor-not-allowed hover:border-gray-500 transition-all"
              title="🎮 Coming Soon..."
            >
              ▶ WD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
