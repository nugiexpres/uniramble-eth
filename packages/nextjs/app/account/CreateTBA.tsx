"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { CreateTBAErrorHandler, useCreateTBAErrorHandler } from "./_components/CreateTBAErrorHandler";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, Copy, Loader2, X } from "lucide-react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { useSmartAccountContext } from "~~/contexts/SmartAccountContext";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
// import deployedContracts from "~~/contracts/deployedContracts";
import { useGaslessTBA } from "~~/hooks/tba/useGaslessTBA";
import { notification } from "~~/utils/scaffold-eth";

export const CreateTBA = () => {
  const { isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // Smart Account Context
  const {
    isSmartAccountDeployed: contextSmartAccountDeployed,
    shouldShowCreateTBA,
    setShouldShowCreateTBA,
    isContextAvailable,
  } = useSmartAccountContext();

  // Local state for TBA creation success
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMintPopup, setShowMintPopup] = useState(false);

  // Error handling
  const { handleMintError, handleCreateTBAError } = useCreateTBAErrorHandler();

  // Copy address functionality
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${type} address copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  // Use gasless TBA hook
  const {
    isMinting,
    isCreatingTBA,
    mintTxHash,
    tbaTxHash,
    error: gaslessError,
    tbaAddress,
    tbaCreated,
    mintNFTGasless,
    createTBAGasless,
    isSmartAccountDeployed,
    smartAccountAddress,
    smartAccountNFTs,
    refetchSmartAccountNFTs,
    foodNFTAddress,
    currentMintPrice,
    smartAccountBalance,
  } = useGaslessTBA();

  // Handle auto-show when Smart Account is deployed (only when context is available)
  useEffect(() => {
    if (isContextAvailable && shouldShowCreateTBA && contextSmartAccountDeployed) {
      console.log("Auto-showing CreateTBA after Smart Account deployment");
      // Refresh data to get latest Smart Account NFTs
      refetchSmartAccountNFTs();
      // Reset the flag
      setShouldShowCreateTBA(false);
    }
  }, [
    isContextAvailable,
    shouldShowCreateTBA,
    contextSmartAccountDeployed,
    refetchSmartAccountNFTs,
    setShouldShowCreateTBA,
  ]);

  // Auto-refresh when Smart Account login state changes (cross-page sync)
  useEffect(() => {
    if (isContextAvailable) {
      console.log("Smart Account context changed, refreshing CreateTBA data...");
      refetchSmartAccountNFTs();
    }
  }, [isContextAvailable, isSmartAccountDeployed, smartAccountAddress, refetchSmartAccountNFTs]);

  // Force refresh on page load to ensure stable state
  useEffect(() => {
    if (smartAccountAddress && isSmartAccountDeployed) {
      console.log("Page loaded, refreshing NFT data for stable state...");
      // Add small delay to ensure all hooks are initialized
      const timer = setTimeout(() => {
        refetchSmartAccountNFTs();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [smartAccountAddress, isSmartAccountDeployed, refetchSmartAccountNFTs]);

  // Envio-powered TBA tracking (for future use)
  // const {
  //   tbaData: envioTbaData,
  //   latestTBA: envioLatestTBA,
  //   loading: envioLoading,
  // } = useSmartAccountTBA(smartAccountAddress || undefined);

  // Check if smart account has NFTs (not EOA wallet)
  const smartAccountHasNFTs = smartAccountNFTs && Array.isArray(smartAccountNFTs) && smartAccountNFTs.length > 0;

  // Debug NFT detection
  React.useEffect(() => {
    console.log("🔍 CreateTBA NFT Check:", {
      smartAccountAddress,
      smartAccountNFTs,
      smartAccountHasNFTs,
      isArray: Array.isArray(smartAccountNFTs),
      length: smartAccountNFTs?.length,
      firstNFT: smartAccountNFTs?.[0],
      firstNFTType: typeof smartAccountNFTs?.[0],
      firstNFTStringified: smartAccountNFTs?.[0] ? JSON.stringify(smartAccountNFTs[0]) : "null",
      allNFTs: smartAccountNFTs?.map((nft, i) => ({
        index: i,
        value: nft,
        type: typeof nft,
        asString: nft?.toString(),
      })),
    });
  }, [smartAccountNFTs, smartAccountHasNFTs, smartAccountAddress]);

  // TBA status - more stable logic (only consider TBA created if explicitly marked or has transaction hash)
  const isTBACreated = tbaCreated || !!tbaTxHash;

  // Mint NFT status - more stable logic (prioritize NFT ownership over transaction hash)
  const isNFTMinted = smartAccountHasNFTs || !!mintTxHash;

  // Format mint price for display
  const formatMintPrice = (price: bigint | undefined) => {
    if (!price) return `0.0000 ${targetNetwork.nativeCurrency.symbol}`;
    const symbol = targetNetwork.nativeCurrency.symbol;
    const decimals = targetNetwork.nativeCurrency.decimals;
    const amount = Number(price) / Math.pow(10, decimals);
    return `${amount.toFixed(4)} ${symbol}`;
  };

  // Handle gasless NFT minting
  const handleMintGasless = async () => {
    if (!foodNFTAddress) {
      console.error("FoodNFT contract address not found");
      return;
    }

    // Check if Smart Account has balance (use current balance from state)
    const currentBalance = smartAccountBalance || 0n;
    const mintPrice = currentMintPrice || parseEther("0.01");

    if (currentBalance < mintPrice) {
      setShowMintPopup(true);
      return;
    }

    try {
      console.log("Minting NFT gasless to smart account...");
      const txHash = await mintNFTGasless();
      if (txHash) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error("Failed to mint NFT gasless:", error);
      handleMintError(error);
    }
  };

  // Handle gasless TBA creation
  const handleCreateTBAGasless = async () => {
    console.log("🎯 handleCreateTBAGasless clicked", {
      smartAccountHasNFTs,
      isTBACreated,
      smartAccountNFTs,
      chainId: targetNetwork.id,
      chainName: targetNetwork.name,
    });

    // Check if user has NFT and TBA is not created yet
    if (!smartAccountHasNFTs || isTBACreated) {
      console.warn("⚠️ Cannot create TBA:", {
        hasNFTs: smartAccountHasNFTs,
        tbaCreated: isTBACreated,
      });
      return;
    }

    // Refresh NFT data before extracting tokenId
    try {
      console.log("🔄 Refreshing NFT data before TBA creation...");
      await refetchSmartAccountNFTs();
    } catch (error) {
      console.error("Failed to refresh NFT data:", error);
    }

    // Get tokenId from smartAccountNFTs (first NFT)
    console.log("🔍 Extracting tokenId from smartAccountNFTs:", {
      smartAccountNFTs,
      isArray: Array.isArray(smartAccountNFTs),
      length: smartAccountNFTs?.length,
      firstElement: smartAccountNFTs?.[0],
      typeOfFirst: typeof smartAccountNFTs?.[0],
      stringified: JSON.stringify(smartAccountNFTs?.[0]),
    });

    let tokenId: bigint | null = null;

    // Try to extract tokenId - handle different data formats
    if (smartAccountNFTs && Array.isArray(smartAccountNFTs) && smartAccountNFTs.length > 0) {
      const firstNFT = smartAccountNFTs[0];

      try {
        // Case 1: Direct bigint value (expected format from uint256[])
        if (typeof firstNFT === "bigint") {
          tokenId = firstNFT;
          console.log("✅ Extracted tokenId as bigint:", tokenId.toString());
        }
        // Case 2: Number that needs conversion
        else if (typeof firstNFT === "number") {
          tokenId = BigInt(firstNFT);
          console.log("✅ Converted tokenId from number:", tokenId.toString());
        }
        // Case 3: String that needs conversion
        else if (typeof firstNFT === "string") {
          tokenId = BigInt(firstNFT);
          console.log("✅ Converted tokenId from string:", tokenId.toString());
        }
        // Case 4: Object with tokenId property
        else if (firstNFT && typeof firstNFT === "object" && "tokenId" in firstNFT) {
          tokenId = BigInt(Number((firstNFT as any).tokenId));
          console.log("✅ Extracted tokenId from object:", tokenId.toString());
        }
        // Case 5: Readonly bigint (from wagmi)
        else if (firstNFT !== null && firstNFT !== undefined) {
          // Try to convert whatever we have to bigint
          tokenId = BigInt(firstNFT.toString());
          console.log("✅ Forced conversion to bigint:", tokenId.toString());
        }
      } catch (conversionError) {
        console.error("❌ Failed to convert firstNFT to bigint:", conversionError, {
          firstNFT,
          type: typeof firstNFT,
        });
      }
    }

    if (!tokenId || tokenId === BigInt(0)) {
      console.error("❌ No valid tokenId found in smartAccountNFTs", {
        smartAccountNFTs,
        attemptedExtraction: tokenId,
        firstNFT: smartAccountNFTs?.[0],
        type: typeof smartAccountNFTs?.[0],
      });
      notification.error("Cannot find NFT tokenId. Trying to refresh data... Please wait a moment and try again.");
      // Force refresh and notify user
      setTimeout(async () => {
        await refetchSmartAccountNFTs();
        notification.info("NFT data refreshed. Please try creating TBA again.");
      }, 1000);
      return;
    }

    console.log("✅ Creating TBA for tokenId:", tokenId.toString());

    try {
      const result = await createTBAGasless(tokenId);

      if (result) {
        console.log("✅ TBA creation successful:", result);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error("❌ Failed to create TBA gasless:", error);
      handleCreateTBAError(error);
    }
  };

  // Auto-hide success message after 3 seconds
  if (showSuccess) {
    setTimeout(() => setShowSuccess(false), 3000);
  }

  // Connection guard
  if (!isConnected) {
    return (
      <WalletConnectionWarning className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-red-500/30 flex items-center justify-center h-full" />
    );
  }

  // Smart account guards - ensure proper connection
  if (!isSmartAccountDeployed) {
    return (
      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-orange-500/30 flex items-center justify-center h-full">
        <div className="text-center p-4">
          <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-orange-300 mb-1">Smart Account Required</h3>
          <p className="text-slate-400 text-xs">Create smart account first for gasless operations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-purple-500/30 flex flex-col h-full">
      {/* Success Animation */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center z-10"
        >
          <div className="bg-slate-800 p-3 rounded-lg shadow-lg flex items-center gap-2 border border-green-400/30">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-medium text-sm">Success!</span>
          </div>
        </motion.div>
      )}

      {/* Mint NFT Popup - Center Page */}
      {showMintPopup && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20"
        >
          <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-orange-400/30 max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-orange-300">Insufficient Balance</h3>
              <button
                onClick={() => setShowMintPopup(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <p className="text-slate-300 mb-4">
                Your Smart Account needs {targetNetwork.nativeCurrency.symbol} to mint NFT. Please fund your Smart
                Account first.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowMintPopup(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowMintPopup(false);
                    // Switch to fund tab or trigger funding
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Fund Account
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Smart Account Status */}
      <div className="mb-2 p-1.5 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-lg">
        <div className="flex items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-cyan-300 font-medium">
              Smart: {smartAccountAddress?.slice(0, 6)}...{smartAccountAddress?.slice(-4)}
            </span>
            <span className="text-slate-400">({smartAccountNFTs?.length || 0} NFTs)</span>
          </div>
          <button
            onClick={() => {
              console.log("🔄 Manual refresh triggered");
              refetchSmartAccountNFTs();
              notification.info("Refreshing NFT data...");
            }}
            className="px-1.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded transition-colors cursor-pointer text-xs"
            title="Refresh NFT data"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs transition-all ${
            mintTxHash
              ? "bg-green-500/20 text-green-300 border border-green-400/30"
              : "bg-purple-500/20 text-purple-300 border border-purple-400/30"
          }`}
        >
          {mintTxHash ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              1
            </span>
          )}
          <span className="font-medium">Mint NFT</span>
        </div>

        <div className={`w-3 h-0.5 rounded-full ${mintTxHash ? "bg-green-400" : "bg-slate-600"}`}></div>

        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs transition-all ${
            tbaTxHash
              ? "bg-green-500/20 text-green-300 border border-green-400/30"
              : mintTxHash
                ? "bg-purple-500/20 text-purple-300 border border-purple-400/30"
                : "bg-slate-500/20 text-slate-400 border border-slate-600/30"
          }`}
        >
          {tbaTxHash ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              2
            </span>
          )}
          <span className="font-medium">Create TBA</span>
        </div>
      </div>

      {/* TBA Address Display */}
      {tbaAddress && (
        <div className="mb-2 p-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 font-medium">
                TBA: {tbaAddress.slice(0, 6)}...{tbaAddress.slice(-4)}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(tbaAddress, "TBA")}
              className="text-green-400 hover:text-green-300 transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Side by Side - Square Layout */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        {/* Gasless Mint NFT */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-purple-500/30 flex flex-col aspect-square">
          {/* Header */}
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-purple-300">Mint NFT</h3>
          </div>

          {/* NFT Preview */}
          <div className="bg-slate-900/50 rounded-lg p-3 mb-2 text-center flex-1 flex flex-col justify-center">
            <div className="relative inline-block">
              <Image
                src="/assets/chog.png"
                width={80}
                height={80}
                alt="UniRamble Chef NFT"
                className="mx-auto rounded-lg"
              />
              {mintTxHash && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Price Badge - Outside the NFT container */}
          <div className="px-1 py-0.5 bg-yellow-500/20 border border-yellow-400/30 rounded-lg mb-2">
            <p className="text-xs text-yellow-300 font-medium text-center">{formatMintPrice(currentMintPrice)}</p>
          </div>

          <button
            className={`w-full py-2 px-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
              isNFTMinted
                ? "bg-green-500/20 text-green-300 cursor-not-allowed border border-green-400/30"
                : isMinting
                  ? "bg-purple-500/20 cursor-not-allowed text-purple-300 border border-purple-400/30"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25 cursor-pointer"
            }`}
            onClick={handleMintGasless}
            disabled={!!(isNFTMinted || isMinting)}
          >
            {isMinting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Minting...
              </>
            ) : isNFTMinted ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Owned
              </>
            ) : (
              <>Mint NFT</>
            )}
          </button>
        </div>

        {/* Gasless Create TBA */}
        <div className="bg-slate-800/50 backdrop-blur-sm p-3 rounded-xl border border-emerald-500/30 flex flex-col aspect-square">
          {/* Header */}
          <div className="text-center mb-2">
            <h3 className="text-sm font-semibold text-emerald-300">Create TBA</h3>
          </div>

          {/* ChefNFT Display - Only 1 ChefNFT per user */}
          {smartAccountHasNFTs ? (
            <div className="bg-slate-900/50 rounded-lg p-3 mb-2 text-center flex-1 flex flex-col justify-center">
              <div className="relative inline-block">
                <Image
                  src="/assets/chog.png"
                  width={80}
                  height={80}
                  alt="Chef NFT"
                  className="mx-auto rounded-lg border border-emerald-400"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          ) : mintTxHash ? (
            <div className="bg-slate-900/50 rounded-lg p-3 mb-2 text-center flex-1 flex flex-col justify-center">
              <CheckCircle className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            </div>
          ) : (
            <div className="bg-slate-900/50 rounded-lg p-3 mb-2 text-center flex-1 flex flex-col justify-center">
              <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            </div>
          )}

          {/* Chef NFT Badge - Outside the NFT container */}
          {smartAccountHasNFTs && (
            <div className="px-1 py-0.5 bg-yellow-500/20 border border-yellow-400/30 rounded-lg mb-2">
              <p className="text-xs text-emerald-300 font-medium text-center">
                Chef #
                {typeof smartAccountNFTs[0] === "bigint"
                  ? smartAccountNFTs[0].toString()
                  : Number(smartAccountNFTs[0]) || "??"}
              </p>
            </div>
          )}

          <button
            className={`w-full py-2 px-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
              isTBACreated
                ? "bg-green-500/20 text-green-300 cursor-not-allowed border border-green-400/30"
                : !smartAccountHasNFTs
                  ? "bg-slate-500/20 text-slate-400 cursor-not-allowed border border-slate-600/30"
                  : isCreatingTBA
                    ? "bg-emerald-500/20 cursor-not-allowed text-emerald-300 border border-emerald-400/30"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            }`}
            onClick={handleCreateTBAGasless}
            disabled={!!(isTBACreated || !smartAccountHasNFTs || isCreatingTBA)}
          >
            {isCreatingTBA ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Creating...
              </>
            ) : isTBACreated ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Active
              </>
            ) : (
              <>{!smartAccountHasNFTs ? "Need NFT First" : "Create TBA"}</>
            )}
          </button>
        </div>
      </div>

      {/* Error Handler */}
      <CreateTBAErrorHandler
        gaslessError={gaslessError}
        onRetryMint={handleMintGasless}
        onRetryCreateTBA={handleCreateTBAGasless}
      />
    </div>
  );
};

export default CreateTBA;
