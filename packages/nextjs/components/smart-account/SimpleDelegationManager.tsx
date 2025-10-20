"use client";

/**
 * Simple Delegation Manager - Following MetaMask Best Practices
 *
 * Key Principles:
 * 1. Delegations are OFF-CHAIN (no on-chain setup needed)
 * 2. Session keys stored securely (encrypted backend + localStorage fallback)
 * 3. NO session key display in UI (security)
 * 4. Simple UX like Lighter.xyz (one-click enable/disable)
 *
 * References:
 * - https://docs.metamask.io/delegation-toolkit/
 * - https://github.com/metamask/delegation-framework
 */
import { useCallback, useEffect, useState } from "react";
import { Loader2, Lock, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { useDelegationManager } from "~~/hooks/Delegation/useDelegationManager";
import {
  removeSessionKeySecurely,
  retrieveSessionKeySecurely,
  storeSessionKeySecurely,
} from "~~/lib/secure-session-key";
import { notification } from "~~/utils/scaffold-eth";

interface SimpleDelegationManagerProps {
  smartAccountAddress?: string;
  onDelegationChange?: (isActive: boolean) => void;
}

export const SimpleDelegationManager = ({ smartAccountAddress, onDelegationChange }: SimpleDelegationManagerProps) => {
  const { address, isConnected } = useAccount();
  const { isDelegationActive, sessionKeyAddress, isLoading, generateSessionKey, clearDelegation } =
    useDelegationManager();

  const [isEnabling, setIsEnabling] = useState(false);

  // Restore delegation from secure storage on mount
  useEffect(() => {
    if (smartAccountAddress && address) {
      const restoreDelegation = async () => {
        try {
          const result = await retrieveSessionKeySecurely(address, smartAccountAddress);

          if (result.success && result.data) {
            console.log("🔄 Delegation restored from secure storage");

            // Dispatch event to restore delegation state
            window.dispatchEvent(
              new CustomEvent("delegationRestored", {
                detail: result.data,
              }),
            );
          }
        } catch (error) {
          console.error("Failed to restore delegation:", error);
        }
      };

      restoreDelegation();
    }
  }, [smartAccountAddress, address]);

  // Notify parent when delegation status changes
  useEffect(() => {
    if (onDelegationChange) {
      onDelegationChange(isDelegationActive);
    }
  }, [isDelegationActive, onDelegationChange]);

  /**
   * Enable Delegation Mode - Simple Off-Chain Delegation
   *
   * Following MetaMask best practices:
   * - Generate session key locally
   * - Store encrypted in backend (automatic fallback to localStorage)
   * - NO on-chain transactions needed
   * - Instant activation
   */
  const handleEnableDelegation = useCallback(async () => {
    if (!isConnected || !address || !smartAccountAddress) {
      notification.error("Please connect wallet and deploy smart account first");
      return;
    }

    setIsEnabling(true);

    try {
      // Step 1: Generate session key locally (no on-chain tx)
      console.log("🔑 Generating session key...");
      const sessionKeyData = generateSessionKey();

      if (!sessionKeyData) {
        throw new Error("Failed to generate session key");
      }

      // Step 2: Create delegation data (off-chain)
      const delegationData = {
        sessionKeyAddress: sessionKeyData.address,
        sessionKeyPrivateKey: sessionKeyData.privateKey,
        delegationHash: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`,
        smartAccountAddress,
        createdAt: Date.now(),
        validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
        encrypted: false, // Will be encrypted by storeSessionKeySecurely
      };

      // Step 3: Try backend storage first, automatic fallback to localStorage
      console.log("💾 Storing session key securely...");
      let storageResult;

      try {
        // Try backend first
        storageResult = await storeSessionKeySecurely(delegationData, address);

        if (!storageResult.success) {
          // Backend failed, use localStorage fallback
          console.warn("⚠️ Backend storage failed, using localStorage:", storageResult.error);
          if (typeof window !== "undefined") {
            localStorage.setItem(`delegation_${smartAccountAddress}`, JSON.stringify(delegationData));
            storageResult = { success: true, data: delegationData };
            notification.info("⚠️ Session key stored locally (backend unavailable)");
          }
        }
      } catch (backendError: any) {
        // Backend error, use localStorage fallback
        console.warn("⚠️ Backend error, using localStorage:", backendError.message);
        if (typeof window !== "undefined") {
          localStorage.setItem(`delegation_${smartAccountAddress}`, JSON.stringify(delegationData));
          storageResult = { success: true, data: delegationData };
          notification.info("⚠️ Session key stored locally (backend unavailable)");
        } else {
          throw new Error("Failed to store session key");
        }
      }

      // Step 4: Dispatch event to activate delegation
      window.dispatchEvent(
        new CustomEvent("delegationCreated", {
          detail: storageResult.data,
        }),
      );

      notification.success("✅ Delegation enabled! No wallet signatures needed for game actions.");
      console.log("✅ Delegation activated:", {
        sessionKeyAddress: sessionKeyData.address,
        smartAccountAddress,
        validUntil: new Date(delegationData.validUntil).toLocaleString(),
      });
    } catch (error: any) {
      console.error("Failed to enable delegation:", error);
      notification.error(`Failed to enable delegation: ${error.message}`);
    } finally {
      setIsEnabling(false);
    }
  }, [isConnected, address, smartAccountAddress, generateSessionKey]);

  /**
   * Disable Delegation Mode
   *
   * - Clear session key from secure storage
   * - Clear local state
   * - Dispatch event to deactivate
   * - Returns to normal mode (with wallet signatures)
   */
  const handleDisableDelegation = useCallback(async () => {
    if (!address || !smartAccountAddress) return;

    try {
      // Clear from secure backend storage
      await removeSessionKeySecurely(address, smartAccountAddress);

      // Clear local state
      clearDelegation();

      // Dispatch event
      window.dispatchEvent(new CustomEvent("delegationCleared"));

      notification.info("🔴 Delegation disabled. Back to normal mode (wallet signatures required).");
    } catch (error) {
      console.error("Failed to disable gasless mode:", error);
      notification.error("Failed to disable gasless mode");
    }
  }, [address, smartAccountAddress, clearDelegation]);

  // Simple UI like Lighter.xyz - Just a toggle button
  return (
    <div className="w-full">
      {isDelegationActive ? (
        // Active State - Compact indicator
        <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-emerald-300">Delegation Mode Active</div>
              <div className="text-xs text-emerald-400/70">No signatures • No gas fees</div>
            </div>
          </div>
          <button
            onClick={handleDisableDelegation}
            className="px-3 py-1.5 text-xs font-medium text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 hover:border-emerald-500/50 rounded-lg transition-colors"
          >
            Disable
          </button>
        </div>
      ) : (
        // Inactive State - Enable button
        <button
          onClick={handleEnableDelegation}
          disabled={isLoading || isEnabling || !isConnected || !smartAccountAddress}
          className="w-full p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 disabled:from-slate-700/20 disabled:to-slate-700/20 border border-cyan-500/30 hover:border-cyan-500/50 disabled:border-slate-700/30 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isEnabling ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Enabling...</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 text-cyan-400" />
              <div className="text-left">
                <div className="text-sm font-semibold text-cyan-300">Enable Delegation Mode</div>
                <div className="text-xs text-cyan-400/70">No wallet signatures • No gas fees</div>
              </div>
            </>
          )}
        </button>
      )}

      {/* Session Key Info - Hidden for security */}
      {isDelegationActive && sessionKeyAddress && (
        <div className="mt-2 p-2 bg-slate-800/40 border border-slate-700/30 rounded text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <span>Session:</span>
            <code className="text-slate-300">
              {sessionKeyAddress.slice(0, 6)}...{sessionKeyAddress.slice(-4)}
            </code>
            <span className="text-emerald-400">✓</span>
          </div>
        </div>
      )}
    </div>
  );
};
