"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowUpDown, CheckCircle, Copy, Loader2, Rocket } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { FundSmartAccount } from "~~/components/smart-account/FundSmartAccount";
import SmartAccountDeployModal from "~~/components/smart-account/SmartAccountDeployModal";
import { useSmartAccountContext } from "~~/contexts/SmartAccountContext";
// import { useSmartAccountTBA } from "~~/hooks/envio/useGameEvents"; // TODO: Next Update
// import { useTokenBalances } from "~~/hooks/envio/useTokenBalances";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { useSmartAccountVerification } from "~~/hooks/smart-account/useSmartAccountVerification";

export const FinalSmartAccount = () => {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { isDeployed, isLoading, error, smartAccountAddress, createAndDeploySmartAccount, reinitializeClients } =
    useFinalSmartAccount();
  const { isVerified, verificationStatus, verifyOwnership } = useSmartAccountVerification();

  // Smart Account Context
  const {
    setIsSmartAccountDeployed,
    setShouldShowCreateTBA,
    isContextAvailable,
    isSmartAccountLoggedIn,
    setIsSmartAccountLoggedIn,
    setSmartAccountAddress,
    resetSmartAccountState,
  } = useSmartAccountContext();

  const { data: eoaBalance } = useBalance({
    address: address,
  });
  const { data: smartAccountBalance } = useBalance({
    address: smartAccountAddress as `0x${string}`,
  });

  // TODO: Next Update -Envio-powered data untuk performa lebih cepat
  // const { latestTBA: envioLatestTBA } = useSmartAccountTBA(smartAccountAddress || undefined);
  //const { balances: envioBalances } = useTokenBalances(envioLatestTBA?.tba || undefined);

  const [activeTab, setActiveTab] = useState<"account" | "fund">("account");

  // Modal state for Smart Account deployment
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployStep, setDeployStep] = useState(1);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Copy address functionality
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You can add a toast notification here if needed
      console.log(`${type} address copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Sync Smart Account state with context (global sync)
  useEffect(() => {
    if (isContextAvailable) {
      setIsSmartAccountDeployed(isDeployed);
      setSmartAccountAddress(smartAccountAddress);

      // Auto-trigger CreateTBA when Smart Account is deployed
      if (isDeployed) {
        console.log("Smart Account deployed! Auto-triggering CreateTBA...");
        setShouldShowCreateTBA(true);
        setIsSmartAccountLoggedIn(true);
        // Auto-switch to fund tab after deployment
        setActiveTab("fund");
      }
    }
  }, [
    isDeployed,
    smartAccountAddress,
    isContextAvailable,
    setIsSmartAccountDeployed,
    setSmartAccountAddress,
    setShouldShowCreateTBA,
    setIsSmartAccountLoggedIn,
  ]);

  // Auto-restore Smart Account from localStorage/sessionStorage on mount (cross-page sync)
  useEffect(() => {
    if (isContextAvailable && isConnected && address) {
      console.log("Checking for existing Smart Account in storage...");

      if (typeof window !== "undefined") {
        // Try localStorage first (permanent storage)
        let mappingKey = localStorage.getItem(`sa_mapping_${address}`);
        let savedState = null;

        if (mappingKey) {
          savedState = localStorage.getItem(mappingKey);
        }

        // Fallback to sessionStorage if localStorage not available
        if (!savedState) {
          mappingKey = sessionStorage.getItem(`sa_mapping_${address}`);
          if (mappingKey) {
            savedState = sessionStorage.getItem(mappingKey);
          }
        }

        if (savedState) {
          try {
            const stateData = JSON.parse(savedState);

            // Validate saved state
            if (stateData?.smartAccountAddress && stateData?.eoaAddress === address) {
              // Check expiration based on version
              const expirationTime = stateData.version === "2.0" ? 30 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
              const isStateValid = Date.now() - (stateData?.timestamp || 0) < expirationTime;

              if (isStateValid) {
                console.log("Auto-restoring Smart Account from storage:", stateData.smartAccountAddress);

                // Sync with context - force update even if already exists
                setIsSmartAccountLoggedIn(true);
                setIsSmartAccountDeployed(stateData.isDeployed || false);
                setSmartAccountAddress(stateData.smartAccountAddress);

                // Auto-trigger CreateTBA if deployed
                if (stateData.isDeployed) {
                  setShouldShowCreateTBA(true);
                  // Auto-switch to fund tab if deployed
                  setActiveTab("fund");
                }

                console.log("Smart Account restored successfully:", {
                  address: stateData.smartAccountAddress,
                  isDeployed: stateData.isDeployed,
                  isLoggedIn: true,
                });
              } else {
                console.log("Smart Account state expired, clearing...");
                // Clear expired state
                if (mappingKey) {
                  localStorage.removeItem(mappingKey);
                  sessionStorage.removeItem(mappingKey);
                }
                localStorage.removeItem(`sa_mapping_${address}`);
                sessionStorage.removeItem(`sa_mapping_${address}`);
              }
            }
          } catch (error) {
            console.error("Failed to parse saved Smart Account state:", error);
          }
        }
      }
    }
  }, [
    isContextAvailable,
    isConnected,
    address,
    isDeployed,
    smartAccountAddress,
    setIsSmartAccountLoggedIn,
    setIsSmartAccountDeployed,
    setSmartAccountAddress,
    setShouldShowCreateTBA,
  ]);

  // Handle wallet disconnect - reset Smart Account state
  useEffect(() => {
    if (!isConnected && isContextAvailable) {
      console.log("Wallet disconnected, resetting Smart Account state...");
      resetSmartAccountState();
    }
  }, [isConnected, isContextAvailable, resetSmartAccountState]);

  // Fix logout state - ensure button shows "Login" after logout
  useEffect(() => {
    if (isContextAvailable && !isConnected) {
      console.log("Wallet disconnected, ensuring login button state...");
      // Force button to show "Login" state after logout
      setIsSmartAccountLoggedIn(false);
    }
  }, [isConnected, isContextAvailable, setIsSmartAccountLoggedIn]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return `0.0000 ${targetNetwork.nativeCurrency?.symbol || "ETH"}`;

    // Get the current chain's native currency symbol
    const symbol = targetNetwork.nativeCurrency?.symbol || "ETH";
    const decimals = targetNetwork.nativeCurrency?.decimals || 18;

    // Convert balance to human readable format
    const formattedBalance = Number(balance) / Math.pow(10, decimals);
    return `${formattedBalance.toFixed(4)} ${symbol}`;
  };

  const handleCreateAndDeploy = async () => {
    console.log("=== handleCreateAndDeploy called ===");
    console.log("isDeployed:", isDeployed);
    console.log("isSmartAccountLoggedIn:", isSmartAccountLoggedIn);
    console.log("smartAccountAddress:", smartAccountAddress);

    // If Smart Account is already deployed, no need to show modal
    if (isDeployed) {
      console.log("Smart Account already deployed");
      return;
    }

    // Check if Smart Account exists in context but not deployed
    if (isSmartAccountLoggedIn && smartAccountAddress && !isDeployed) {
      console.log("Smart Account exists in context but not deployed, proceeding with deployment...");
    }

    // If we reach here, proceed with deployment
    console.log("Proceeding with Smart Account deployment...");

    // Show deploy modal for new Smart Account creation or restoration
    console.log("Showing Smart Account deploy modal...");
    setDeployStep(1);
    setDeployError(null);
    setShowDeployModal(true);

    try {
      // Step 1: Deploy Smart Account (1st signature)
      console.log("Step 1: Deploying Smart Account (1st signature)...");
      setDeployStep(1);

      const result = await createAndDeploySmartAccount();

      if (result) {
        // Step 2: Verify Smart Account ownership (2nd signature - REAL SIGNATURE)
        console.log("Step 2: Verifying Smart Account ownership (2nd signature - requesting user signature)...");
        setDeployStep(2);

        // Add delay to ensure Smart Account address is updated in all hooks
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Call REAL verifyOwnership function that requires user signature
        console.log("Requesting verification signature with:", {
          smartAccountAddress,
          eoaAddress: address,
        });

        try {
          const verificationResult = await verifyOwnership();

          if (!verificationResult) {
            // Verification failed or rejected - but Smart Account is deployed
            console.warn("⚠️ Verification rejected, but Smart Account is deployed");

            // Mark as logged in anyway (can verify later)
            if (isContextAvailable) {
              setIsSmartAccountLoggedIn(true);
            }

            // Show warning but allow to continue
            setDeployError("Verification skipped. You can verify ownership later from Account page.");

            // Close modal after showing warning
            setTimeout(() => {
              setShowDeployModal(false);
              setDeployStep(1);
              setDeployError(null);
            }, 3000);

            return; // Exit without throwing error
          }

          console.log("Smart Account ownership verified successfully with signature!");
          setDeployStep(3);

          // Sync with context
          if (isContextAvailable) {
            setIsSmartAccountLoggedIn(true);
          }

          // Close modal after success
          setTimeout(() => {
            setShowDeployModal(false);
            setDeployStep(1);
          }, 2000);
        } catch (verifyError: any) {
          console.error("Verification error:", verifyError);

          // If user rejected, allow to continue but show warning
          if (verifyError.message?.includes("rejected") || verifyError.message?.includes("denied")) {
            console.warn("⚠️ User rejected verification signature");

            // Mark as logged in anyway (Smart Account is deployed)
            if (isContextAvailable) {
              setIsSmartAccountLoggedIn(true);
            }

            setDeployError("Verification signature rejected. Smart Account is ready but not verified.");

            setTimeout(() => {
              setShowDeployModal(false);
              setDeployStep(1);
              setDeployError(null);
            }, 3000);

            return; // Exit without throwing error
          }

          // For other errors, throw
          throw verifyError;
        }
      } else {
        throw new Error("Failed to deploy Smart Account");
      }
    } catch (error: any) {
      console.error("Deployment failed:", error);
      const errorMessage = error.message || "Failed to create Smart Account";
      setDeployError(errorMessage);

      // Close modal after showing error
      setTimeout(() => {
        setShowDeployModal(false);
        setDeployStep(1);
      }, 3000);
    }
  };

  if (!isConnected) {
    return (
      <WalletConnectionWarning className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-600/30" />
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 h-full flex flex-col">
      {/* Header with Tabs */}
      <div className="p-2 border-b border-cyan-500/20">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-white">MetaMask Smart Account</h3>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-700/50 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "account"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab("fund")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === "fund"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            Fund
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-2 overflow-y-auto">
        {activeTab === "account" ? (
          <div className="space-y-2">
            {/* Wallet Info Compact */}
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-slate-700/30 rounded-lg p-1.5">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="text-xs text-slate-400">EOA</div>
                  <button
                    onClick={() => copyToClipboard(address!, "EOA")}
                    className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{formatAddress(address!)}</div>
                <div className="text-xs text-cyan-300">{formatBalance(eoaBalance?.value)}</div>
              </div>
              {smartAccountAddress && (
                <div className="bg-slate-700/30 rounded-lg p-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="text-xs text-slate-400">Smart</div>
                    <button
                      onClick={() => copyToClipboard(smartAccountAddress, "Smart Account")}
                      className="text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-cyan-300 mb-0.5">{formatAddress(smartAccountAddress)}</div>
                  <div className="text-xs text-cyan-300">{formatBalance(smartAccountBalance?.value)}</div>
                </div>
              )}
            </div>

            {/* Deployment Status */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-700/30 rounded-lg">
              {isDeployed ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-300 font-medium text-xs">Deployed</span>
                </>
              ) : smartAccountAddress ? (
                <>
                  <AlertCircle className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-300 font-medium text-xs">Restored</span>
                </>
              ) : isSmartAccountLoggedIn ? (
                <>
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span className="text-green-300 font-medium text-xs">Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-300 font-medium text-xs">No Account</span>
                </>
              )}
            </div>

            {/* Info Banner */}
            {!isDeployed && !smartAccountAddress && !isSmartAccountLoggedIn && (
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-1.5">
                <div className="flex items-center gap-1.5">
                  <Rocket className="w-3 h-3 text-blue-400" />
                  <div>
                    <div className="text-blue-300 font-medium text-xs">Create Smart Account</div>
                    <div className="text-blue-200 text-xs">Deploy gasless account</div>
                  </div>
                </div>
              </div>
            )}

            {/* Persistence Status */}
            {smartAccountAddress && !isDeployed && isSmartAccountLoggedIn && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <div>
                    <div className="text-green-300 font-medium text-xs">Smart Account Active</div>
                    <div className="text-green-200 text-xs">Ready for gasless transactions</div>
                  </div>
                </div>
              </div>
            )}

            {/* Smart Account Button */}
            <button
              onClick={() => {
                console.log("=== Button clicked ===");
                console.log("isLoading:", isLoading);
                console.log("isDeployed:", isDeployed);
                console.log("isSmartAccountLoggedIn:", isSmartAccountLoggedIn);
                console.log("smartAccountAddress:", smartAccountAddress);
                handleCreateAndDeploy();
              }}
              disabled={isLoading || isDeployed || !!(smartAccountAddress && isSmartAccountLoggedIn)}
              className={`w-full py-1.5 px-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
                isDeployed || !!(smartAccountAddress && isSmartAccountLoggedIn)
                  ? "bg-green-500/20 text-green-300 cursor-not-allowed border border-green-400/30"
                  : isLoading
                    ? "bg-cyan-500/20 cursor-not-allowed text-cyan-300 border border-cyan-400/30"
                    : "bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="w-3 h-3" />
                  {isDeployed
                    ? "Deployed ✓"
                    : smartAccountAddress && isSmartAccountLoggedIn
                      ? "Active ✓"
                      : "Create Smart Account"}
                </>
              )}
            </button>

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-red-400" />
                  <div className="flex-1">
                    <div className="text-red-300 text-xs">{error}</div>
                    {(error.includes("clients not initialized") || error.includes("Initializing clients")) && (
                      <button
                        onClick={reinitializeClients}
                        disabled={isLoading}
                        className="mt-0.5 text-xs text-red-300 hover:text-red-200 underline cursor-pointer disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Reinitializing..." : "Reinitialize"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <FundSmartAccount />
        )}
      </div>

      {/* Smart Account Deploy Modal */}
      <SmartAccountDeployModal
        isOpen={showDeployModal}
        onClose={() => setShowDeployModal(false)}
        currentStep={deployStep}
        totalSteps={2}
        stepTitle={
          deployStep === 1
            ? "Deploying Smart Account"
            : deployStep === 2
              ? "Verifying Ownership"
              : "Deployment Complete"
        }
        stepDescription={
          deployStep === 1
            ? "Please sign the transaction in MetaMask to deploy your Smart Account contract"
            : deployStep === 2
              ? "Please sign the transaction in MetaMask to verify ownership of your Smart Account"
              : "Your Smart Account has been successfully created and verified"
        }
        isProcessing={isLoading}
        error={deployError}
        onVerifyOwnership={verifyOwnership}
        verificationStatus={verificationStatus}
        isVerified={isVerified}
      />
    </div>
  );
};
