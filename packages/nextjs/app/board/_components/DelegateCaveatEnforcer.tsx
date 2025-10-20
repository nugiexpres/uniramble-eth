"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useHybridDelegation } from "~~/hooks/delegation/hybrid/useHybridDelegation";
import { useMetaMask } from "~~/providers/MetaMaskProvider";

interface DelegateCaveatEnforcerProps {
  className?: string;
}

export const DelegateCaveatEnforcer = ({ className = "" }: DelegateCaveatEnforcerProps) => {
  const { address: delegator } = useAccount();
  const { connectedAccount, disconnectMetaMask } = useMetaMask();
  const {
    isLoading,
    isSetupComplete,
    delegationHash,
    createHybridDelegation,
    getDefaultFinancialConfig,
    getDefaultGameConfig,
    clearDelegation,
  } = useHybridDelegation();

  // Use connected MetaMask account as default delegatee
  const defaultDelegatee = useMemo(() => {
    return connectedAccount || "";
  }, [connectedAccount]);

  const [delegatee, setDelegatee] = useState<string>(defaultDelegatee);
  const [isManualEdit, setIsManualEdit] = useState(false);

  // Auto-update delegatee ketika ada perubahan dari hook atau MetaMask
  useEffect(() => {
    if (!isManualEdit) {
      setDelegatee(defaultDelegatee);
    }
  }, [defaultDelegatee, isManualEdit]);

  // Auto-create delegation jika ada connectedAccount dan belum setup
  useEffect(() => {
    const autoCreateDelegation = async () => {
      if (connectedAccount && !isSetupComplete && !isLoading && delegator) {
        const game = getDefaultGameConfig();
        const financial = getDefaultFinancialConfig();
        await createHybridDelegation(connectedAccount, game, financial);
      }
    };

    autoCreateDelegation();
  }, [
    connectedAccount,
    isSetupComplete,
    isLoading,
    delegator,
    getDefaultGameConfig,
    getDefaultFinancialConfig,
    createHybridDelegation,
  ]);

  const onCreate = async () => {
    if (!delegatee) return;
    const game = getDefaultGameConfig();
    const financial = getDefaultFinancialConfig();
    await createHybridDelegation(delegatee, game, financial);
    setIsManualEdit(false); // Reset manual edit flag setelah create
  };

  const onLogoutDelegate = async () => {
    clearDelegation();
    setIsManualEdit(false); // Reset manual edit flag
    // Also disconnect MetaMask session if any delegate specifically came from MetaMask
    try {
      await disconnectMetaMask();
    } catch {}
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDelegatee(e.target.value);
    setIsManualEdit(true); // Tandai bahwa user sedang edit manual
  };

  return (
    <div className={`rounded-lg border border-slate-700/50 bg-slate-800/60 p-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">MetaMask Delegate (Caveat Enforcer)</span>
        {isSetupComplete ? (
          <span className="text-[10px] text-emerald-400">Active</span>
        ) : (
          <span className="text-[10px] text-slate-400">Idle</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-[11px] text-slate-400">
          <div>
            Delegator:{" "}
            <span className="text-slate-300">
              {delegator ? `${delegator.slice(0, 6)}...${delegator.slice(-4)}` : "-"}
            </span>
          </div>
          <div>
            Delegatee:{" "}
            <span className="text-slate-300">
              {delegatee ? `${delegatee.slice(0, 6)}...${delegatee.slice(-4)}` : "-"}
            </span>
          </div>
          {delegationHash && (
            <div className="truncate">
              Hash: <span className="text-cyan-300">{delegationHash}</span>
            </div>
          )}
        </div>

        {/* Input hanya ditampilkan jika belum ada delegation atau user ingin edit manual */}
        {(!isSetupComplete || isManualEdit) && (
          <input
            value={delegatee}
            onChange={handleInputChange}
            placeholder="Delegatee address (auto-detected)"
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none placeholder:text-slate-500"
          />
        )}

        <div className="flex gap-2">
          {!isSetupComplete && (
            <button
              onClick={onCreate}
              disabled={isLoading || !delegatee}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                isLoading || !delegatee
                  ? "cursor-not-allowed bg-slate-700 text-slate-400"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
              }`}
            >
              {isLoading ? "Setting up..." : "Create Delegation"}
            </button>
          )}

          {isSetupComplete && (
            <>
              <button
                onClick={() => setIsManualEdit(true)}
                className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Change Delegatee
              </button>
              <button
                onClick={onLogoutDelegate}
                className="rounded-md bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-600"
              >
                Logout Delegate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
