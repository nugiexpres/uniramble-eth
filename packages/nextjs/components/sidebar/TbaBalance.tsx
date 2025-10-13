"use client";

import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, Loader2, Send, TrendingUp } from "lucide-react";
import { parseEther } from "viem";
import { useAccount, useBalance, useSendTransaction } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useTbaBalance } from "~~/hooks/tba/useTbaBalance";
import { getBlockExplorerTxLink } from "~~/utils/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export function TbaBalance() {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const tbaBalanceHook = useTbaBalance();
  const tbaAddress = tbaBalanceHook?.tbaAddress;

  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"send" | "withdraw">("send");

  // Get balance of TBA address
  const {
    data: balanceData,
    isLoading: loadingBalance,
    refetch: refetchBalance,
  } = useBalance({
    address: tbaAddress as `0x${string}` | undefined,
    query: {
      enabled: !!tbaAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Send transaction hook
  const { sendTransactionAsync, isPending: isSendPending } = useSendTransaction();

  const handleSend = async () => {
    if (!tbaAddress || !amount || !address) {
      notification.error("Invalid input or missing address");
      return;
    }

    try {
      const amountInWei = parseEther(amount);

      const txHash = await sendTransactionAsync({
        to: tbaAddress as `0x${string}`,
        value: amountInWei,
      });

      const txUrl = getBlockExplorerTxLink(targetNetwork.id, txHash);

      notification.success(
        <div className="flex flex-col gap-1">
          <span>
            Sent {amount} {targetNetwork.nativeCurrency.symbol} to TBA
          </span>
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 text-xs">
              View on Explorer
            </a>
          )}
        </div>,
      );

      setAmount("");
      await refetchBalance();
    } catch (err: any) {
      notification.error(`Failed: ${err?.shortMessage || err?.message || "Transaction failed"}`);
    }
  };

  const handleWithdraw = async () => {
    notification.info("Withdraw functionality coming soon");
  };

  const balance = balanceData?.formatted ? parseFloat(balanceData.formatted).toFixed(4) : "0.0000";

  if (!isConnected) {
    return (
      <WalletConnectionWarning className="w-full bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/60" />
    );
  }

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/20 rounded flex items-center justify-center">
              <span className="text-white/90 text-xs font-bold">TBA</span>
            </div>
            <span className="text-white/90 text-xs font-medium">TBA Wallet</span>
          </div>
          <TrendingUp className="text-white/70" size={14} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          {/* Left Side - Actions */}
          <div className="flex-1">
            {/* Toggle Pills */}
            <div className="flex bg-slate-100 rounded-lg p-0.5 mb-3">
              <button
                onClick={() => setMode("send")}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  mode === "send" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Send size={10} />
                Send
              </button>
              <button
                onClick={() => setMode("withdraw")}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                  mode === "withdraw" ? "bg-white text-orange-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <Download size={10} />
                Withdraw
              </button>
            </div>

            {/* Action Form */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  step="0.0001"
                  min="0"
                  className="w-full text-center font-mono text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-lg h-8 px-2 outline-none transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  {targetNetwork.nativeCurrency.symbol}
                </div>
              </div>

              <button
                onClick={mode === "send" ? handleSend : handleWithdraw}
                disabled={isSendPending || !amount || !tbaAddress}
                className={`w-full h-8 font-medium rounded-lg transition-all duration-200 text-xs flex items-center justify-center gap-1 ${
                  mode === "send"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white disabled:from-blue-300 disabled:to-blue-400"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:from-orange-300 disabled:to-orange-400"
                } disabled:cursor-not-allowed`}
              >
                {isSendPending ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {mode === "send" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                    {mode === "send" ? "Send" : "Withdraw"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side - Balance Display */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-3 text-center border border-slate-200/50">
              <div className="text-xs text-slate-500 mb-1 font-medium">Balance</div>
              <div className="text-sm font-bold text-slate-800 mb-1">
                {loadingBalance ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <span className="font-mono">{balance}</span>
                )}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                {balanceData?.symbol || targetNetwork.nativeCurrency.symbol}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Status */}
        <div className="flex items-center justify-center mt-3 pt-3 border-t border-slate-200/50">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <div className={`w-1.5 h-1.5 rounded-full ${tbaAddress ? "bg-green-400" : "bg-slate-300"}`} />
            {tbaAddress ? (
              <span className="font-mono">
                {tbaAddress.slice(0, 6)}...{tbaAddress.slice(-4)}
              </span>
            ) : (
              "No TBA"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
