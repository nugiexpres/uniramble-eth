"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle, Key, Loader2, Lock, Shield, XCircle, Zap } from "lucide-react";
import { useAccount } from "wagmi";
import { useCaveatEnforcer } from "~~/hooks/Delegation/useCaveatEnforcer";
import { useDelegationManager } from "~~/hooks/Delegation/useDelegationManager";
import { useHybridDelegation } from "~~/hooks/delegation/hybrid/useHybridDelegation";
import {
  removeSessionKeySecurely,
  retrieveSessionKeyFallback,
  retrieveSessionKeySecurely,
  storeSessionKeyFallback,
  storeSessionKeySecurely,
} from "~~/lib/secure-session-key";
import { notification } from "~~/utils/scaffold-eth";

interface DelegationCaveatEnforcerProps {
  smartAccountAddress?: string;
  onDelegationCreated?: (sessionKey: string, delegationHash: string) => void;
  onDelegationCleared?: () => void;
}

export const DelegationCaveatEnforcer = ({
  smartAccountAddress,
  onDelegationCreated,
  onDelegationCleared,
}: DelegationCaveatEnforcerProps) => {
  const { address, isConnected } = useAccount();
  const {
    isDelegationActive,
    sessionKeyAddress,
    sessionKeyPrivateKey,
    delegationHash,
    isLoading,
    error,
    generateSessionKey,
    clearDelegation,
  } = useDelegationManager();

  const { getDefaultGameConfig, getDefaultFinancialConfig } = useHybridDelegation();
  const {
    enforcerAddress,
    setupHybridDelegation,
    setGameActionLimits,
    setRateLimit,
    setSpendingLimit,
    generateDelegationHash,
  } = useCaveatEnforcer();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSessionKey, setShowSessionKey] = useState(false);
  const [caveatSetupStatus, setCaveatSetupStatus] = useState<{
    gameActions: boolean;
    rateLimit: boolean;
    spendingLimit: boolean;
  }>({ gameActions: false, rateLimit: false, spendingLimit: false });
  const [isSettingUpCaveats, setIsSettingUpCaveats] = useState(false);

  // Restore delegation from secure backend storage on mount
  useEffect(() => {
    if (smartAccountAddress && address) {
      const restoreDelegation = async () => {
        try {
          // Try to retrieve from secure backend first
          const result = await retrieveSessionKeySecurely(address, smartAccountAddress);

          if (result.success && result.data) {
            console.log("🔄 Restoring delegation from secure backend:", result.data);
            // Restore to useDelegationManager state
            window.dispatchEvent(
              new CustomEvent("delegationRestored", {
                detail: result.data,
              }),
            );
          } else {
            // Fallback to localStorage if backend fails
            console.warn("Backend retrieval failed, trying localStorage:", result.error);
            const fallbackResult = await retrieveSessionKeyFallback(smartAccountAddress);

            if (fallbackResult.success && fallbackResult.data) {
              console.log("🔄 Restoring delegation from localStorage fallback:", fallbackResult.data);
              // Restore to useDelegationManager state
              window.dispatchEvent(
                new CustomEvent("delegationRestored", {
                  detail: fallbackResult.data,
                }),
              );
            }
          }
        } catch (error) {
          console.error("Failed to restore delegation:", error);
          // Final fallback to localStorage
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem(`delegation_${smartAccountAddress}`);
            if (stored) {
              try {
                const delegationData = JSON.parse(stored);
                if (delegationData.validUntil > Date.now()) {
                  console.log("🔄 Restoring delegation from localStorage final fallback:", delegationData);
                  window.dispatchEvent(
                    new CustomEvent("delegationRestored", {
                      detail: delegationData,
                    }),
                  );
                } else {
                  localStorage.removeItem(`delegation_${smartAccountAddress}`);
                }
              } catch (parseError) {
                console.error("Failed to parse stored delegation:", parseError);
                localStorage.removeItem(`delegation_${smartAccountAddress}`);
              }
            }
          }
        }
      };

      restoreDelegation();
    }
  }, [smartAccountAddress, address]);

  // Auto-expand when there's an error
  useEffect(() => {
    if (error) {
      setIsExpanded(true);
    }
  }, [error]);

  // Notify parent when delegation is created
  useEffect(() => {
    if (isDelegationActive && sessionKeyPrivateKey && delegationHash && onDelegationCreated) {
      onDelegationCreated(sessionKeyPrivateKey, delegationHash);
    }
  }, [isDelegationActive, sessionKeyPrivateKey, delegationHash, onDelegationCreated]);

  const handleCreateDelegation = useCallback(async () => {
    if (!isConnected || !address || !smartAccountAddress) {
      notification.error("Connect wallet and deploy smart account first");
      return;
    }

    try {
      // Step 1: Generate session key
      notification.info("🔑 Generating session key...");
      const sessionKeyData = generateSessionKey();
      if (!sessionKeyData) {
        throw new Error("Failed to generate session key");
      }

      // Step 2: Generate delegation hash
      notification.info("🔄 Creating delegation hash...");
      const nonce = Date.now();
      const delegationHash = generateDelegationHash(smartAccountAddress, sessionKeyData.address, "gameActions", nonce);

      console.log("✅ Delegation hash created:", {
        delegationHash,
        delegator: smartAccountAddress,
        delegate: sessionKeyData.address,
      });

      // Step 3: Setup caveat enforcers on-chain
      notification.info("⚙️ Setting up caveat enforcers on-chain...");
      setIsSettingUpCaveats(true);
      setCaveatSetupStatus({ gameActions: false, rateLimit: false, spendingLimit: false });

      // Get default configurations
      const gameConfig = getDefaultGameConfig();
      const financialConfig = getDefaultFinancialConfig();

      try {
        // Setup hybrid delegation (registers delegation in hub)
        notification.info("📝 Registering delegation in enforcer hub...");
        const setupSuccess = await setupHybridDelegation(delegationHash);
        if (!setupSuccess) {
          throw new Error("Failed to setup hybrid delegation");
        }

        // Set game action limits
        notification.info("🎮 Setting game action limits...");
        await setGameActionLimits(
          delegationHash,
          gameConfig.maxRolls,
          gameConfig.maxBuys,
          gameConfig.maxRails,
          gameConfig.maxFaucets,
          gameConfig.maxCooks,
          gameConfig.validUntil,
        );
        setCaveatSetupStatus(prev => ({ ...prev, gameActions: true }));

        // Set rate limit
        notification.info("⏱️ Setting rate limits...");
        await setRateLimit(delegationHash, gameConfig.rateLimit);
        setCaveatSetupStatus(prev => ({ ...prev, rateLimit: true }));

        // Set spending limit
        notification.info("💰 Setting spending limits...");
        await setSpendingLimit(
          delegationHash,
          financialConfig.tokenAddress,
          financialConfig.spendingLimit,
          financialConfig.validUntil,
          financialConfig.periodLength,
        );
        setCaveatSetupStatus(prev => ({ ...prev, spendingLimit: true }));

        notification.success("✅ All caveat enforcers configured!");
      } catch (caveatError: any) {
        console.warn("Caveat setup failed, continuing with basic delegation:", caveatError);

        // Check if it's an Ownable error
        if (caveatError.message?.includes("OwnableUnauthorizedAccount")) {
          notification.error(
            "❌ Contract needs redeploy! Please redeploy BasicCaveatEnforcer contract. See REDEPLOY_INSTRUCTIONS.md",
          );
          throw caveatError; // Stop execution, don't continue with basic delegation
        } else {
          notification.warning("⚠️ Caveat setup failed, using basic delegation mode");
        }
      } finally {
        setIsSettingUpCaveats(false);
      }

      // Create signed delegation object
      const signedDelegation = {
        delegator: smartAccountAddress,
        delegate: sessionKeyData.address,
        delegationHash,
        caveats: [
          {
            enforcer: enforcerAddress,
            terms: "0x",
            args: "0x",
          },
        ],
        signature: "0x",
      };

      // Step 4: Store session key securely in backend (with fallback to localStorage)
      notification.info("💾 Storing delegation data securely...");
      if (address && smartAccountAddress) {
        const delegationData = {
          sessionKeyAddress: sessionKeyData.address,
          sessionKeyPrivateKey: sessionKeyData.privateKey,
          delegationHash: delegationHash,
          signedDelegation: signedDelegation,
          smartAccountAddress,
          createdAt: Date.now(),
          validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
          encrypted: false, // Will be encrypted by storeSessionKeySecurely
        };

        try {
          // Try to store securely in backend first
          const result = await storeSessionKeySecurely(delegationData, address);

          if (result.success) {
            // Emit event for GameControls to listen
            window.dispatchEvent(
              new CustomEvent("delegationCreated", {
                detail: result.data,
              }),
            );
          } else {
            // Fallback to localStorage if backend fails
            console.warn("Backend storage failed, falling back to localStorage:", result.error);
            const fallbackResult = await storeSessionKeyFallback(delegationData, smartAccountAddress);

            if (fallbackResult.success) {
              // Emit event for GameControls to listen
              window.dispatchEvent(
                new CustomEvent("delegationCreated", {
                  detail: fallbackResult.data,
                }),
              );
            }
          }
        } catch (error) {
          console.error("Failed to store delegation data:", error);
          // Final fallback to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(`delegation_${smartAccountAddress}`, JSON.stringify(delegationData));

            // Emit event for GameControls to listen
            window.dispatchEvent(
              new CustomEvent("delegationCreated", {
                detail: delegationData,
              }),
            );
          }
        }
      }

      notification.success("✅ Delegation activated! Game actions are now GASLESS + NO WALLET SIGNATURE needed!");
    } catch (error: any) {
      console.error("Delegation creation error:", error);
      notification.error(`Failed to setup delegation: ${error.message}`);

      // Fallback: Create local delegation for testing
      try {
        const sessionKeyData = generateSessionKey();
        if (sessionKeyData) {
          const mockHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;

          const delegationData = {
            sessionKeyAddress: sessionKeyData.address,
            sessionKeyPrivateKey: sessionKeyData.privateKey,
            delegationHash: mockHash,
            smartAccountAddress,
            createdAt: Date.now(),
            validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
          };

          localStorage.setItem(`delegation_${smartAccountAddress}`, JSON.stringify(delegationData));
          window.dispatchEvent(
            new CustomEvent("delegationCreated", {
              detail: delegationData,
            }),
          );

          notification.success("✅ Delegation activated (local testing mode)!");
        }
      } catch (fallbackError) {
        console.error("Fallback delegation creation failed:", fallbackError);
      }
    }
  }, [
    isConnected,
    address,
    smartAccountAddress,
    generateSessionKey,
    generateDelegationHash,
    setupHybridDelegation,
    setGameActionLimits,
    setRateLimit,
    setSpendingLimit,
    getDefaultGameConfig,
    getDefaultFinancialConfig,
    enforcerAddress,
  ]);

  const handleClearDelegation = useCallback(async () => {
    clearDelegation();

    // Clear from secure backend storage (with fallback to localStorage)
    if (smartAccountAddress && address) {
      try {
        // Try to remove from secure backend first
        const result = await removeSessionKeySecurely(address, smartAccountAddress);

        if (!result.success) {
          // Fallback to localStorage if backend fails
          console.warn("Backend removal failed, clearing localStorage:", result.error);
          if (typeof window !== "undefined") {
            localStorage.removeItem(`delegation_${smartAccountAddress}`);
          }
        }
      } catch (error) {
        console.error("Failed to clear delegation from backend:", error);
        // Final fallback to localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem(`delegation_${smartAccountAddress}`);
        }
      }
    }

    // Emit event to notify all listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("delegationCleared"));
    }

    if (onDelegationCleared) {
      onDelegationCleared();
    }

    notification.info("🔴 Delegation disabled. Wallet signatures + gas fees required again.");
  }, [clearDelegation, smartAccountAddress, address, onDelegationCleared]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    notification.success(`${label} copied to clipboard`);
  };

  // Get default configs for display
  const gameConfig = getDefaultGameConfig();

  return (
    <div className="w-full">
      {/* Collapsed View - Compact Status Badge */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="flex items-center justify-between p-2 bg-slate-800/60 backdrop-blur-sm rounded-lg border border-slate-700/50 cursor-pointer hover:bg-slate-700/70 transition-all"
        >
          <div className="flex items-center gap-2">
            {isDelegationActive ? (
              <>
                <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400">Gasless Mode Active</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-300">Enable Gasless Mode</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500">Expand</div>
        </div>
      )}

      {/* Expanded View - Compact Gaming Style */}
      {isExpanded && (
        <div className="relative">
          {/* Animated Border Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-xl blur-sm opacity-40 animate-pulse"></div>

          <div className="relative border border-slate-700/50 rounded-xl p-3 bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl">
            {/* Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isDelegationActive ? "text-emerald-400" : "text-slate-500"}`} />
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Gasless Delegation Mode</h3>
                  <p className="text-xs text-slate-500">No wallet sign + No gas fees</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>

            {/* Compact Status Badge */}
            <div className="mb-2">
              {isDelegationActive ? (
                <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300">
                    Gasless mode active - No signatures needed!
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">Enable gasless mode with caveat enforcers</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-2 mt-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-red-300">{error}</span>
                </div>
              )}
            </div>

            {/* Caveat Enforcer Status - Show during setup */}
            {isSettingUpCaveats && (
              <div className="bg-slate-800/60 rounded-lg p-2 mb-2 border border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Setting up Caveat Enforcers...
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    {caveatSetupStatus.gameActions ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    )}
                    <span className="text-slate-300">Game Action Limits</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {caveatSetupStatus.rateLimit ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    )}
                    <span className="text-slate-300">Rate Limiting</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {caveatSetupStatus.spendingLimit ? (
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                    )}
                    <span className="text-slate-300">Spending Limits</span>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Caveat Limits - Only when not active */}
            {!isDelegationActive && !isSettingUpCaveats && (
              <div className="bg-slate-800/60 rounded-lg p-2 mb-2 border border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Caveat Enforcer Limits
                </h4>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Rolls</div>
                    <div className="font-bold text-slate-200">{gameConfig.maxRolls}</div>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Buys</div>
                    <div className="font-bold text-slate-200">{gameConfig.maxBuys}</div>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Rails</div>
                    <div className="font-bold text-slate-200">{gameConfig.maxRails}</div>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Cooks</div>
                    <div className="font-bold text-slate-200">{gameConfig.maxCooks}</div>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Rate</div>
                    <div className="font-bold text-slate-200">{gameConfig.rateLimit}/h</div>
                  </div>
                  <div className="bg-slate-900/50 p-1.5 rounded text-center">
                    <div className="text-slate-500 text-xs">Valid</div>
                    <div className="font-bold text-slate-200">30d</div>
                  </div>
                </div>
              </div>
            )}

            {/* Compact Session Key Info */}
            {isDelegationActive && sessionKeyAddress && (
              <div className="bg-slate-800/60 rounded-lg p-2 mb-2 border border-slate-700/50">
                <h4 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Session Key
                </h4>
                <div className="space-y-1.5">
                  {/* Address - Compact */}
                  <div className="flex items-center gap-1">
                    <code className="text-xs bg-slate-900/70 px-1.5 py-1 rounded flex-1 text-slate-300 truncate">
                      {sessionKeyAddress.slice(0, 10)}...{sessionKeyAddress.slice(-8)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(sessionKeyAddress, "Address")}
                      className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200"
                      title="Copy"
                    >
                      <span className="text-xs">📋</span>
                    </button>
                  </div>

                  {/* Private Key - Compact */}
                  {sessionKeyPrivateKey && (
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-slate-900/70 px-1.5 py-1 rounded flex-1 text-slate-300 truncate">
                        {showSessionKey ? sessionKeyPrivateKey.slice(0, 20) + "..." : "•".repeat(20)}
                      </code>
                      <button
                        onClick={() => setShowSessionKey(!showSessionKey)}
                        className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200"
                        title={showSessionKey ? "Hide" : "Show"}
                      >
                        <span className="text-xs">{showSessionKey ? "👁️" : "🔒"}</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(sessionKeyPrivateKey, "Key")}
                        className="p-1 hover:bg-slate-700/50 rounded text-slate-400 hover:text-slate-200"
                        title="Copy"
                      >
                        <span className="text-xs">📋</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compact Action Button */}
            {!isDelegationActive ? (
              <button
                onClick={handleCreateDelegation}
                disabled={isLoading || isSettingUpCaveats || !isConnected || !smartAccountAddress}
                className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading || isSettingUpCaveats ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {isSettingUpCaveats ? "Setting up caveats..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Enable Gasless Mode
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleClearDelegation}
                className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold text-xs rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <XCircle className="w-3.5 h-3.5" />
                Clear Delegation
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
