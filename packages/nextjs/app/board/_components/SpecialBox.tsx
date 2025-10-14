import { useState } from "react";
import Image from "next/image";
import { SpecialBoxModals } from "./SpecialBoxModals";
import { motion } from "framer-motion";
import { Coins, Gift, Package, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";
import { WalletConnectionWarning } from "~~/components/scaffold-eth";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { useSpecialBoxMint } from "~~/hooks/specialbox/useSpecialBoxMint";

interface SpecialBoxProps {
  className?: string;
}

export const SpecialBox = ({ className = "" }: SpecialBoxProps) => {
  const { address, isConnected } = useAccount();
  const [showFailModal, setShowFailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get Smart Account state
  useFinalSmartAccount();

  // Get TBA address from Smart Account (not EOA)
  const { tbaAddress: smartAccountTbaAddress, envioLoading } = useSmartAccountTBA();

  // Use the SpecialBox mint hook (updated with TBA support)
  const {
    canMintAmount,
    maxMintable,
    boxPrice,
    boxPriceWei,
    hamburgerCost,
    hamburgerCount,
    tbaAddress,
    mint,
    mintAll,
    formatMintCost,
    isLoading: mintHookLoading,
    isMintLoading,
    isProcessing,
    canMint,
    hasEnoughHamburgers,
    isValidAmount,
    debugInfo,
  } = useSpecialBoxMint();

  // Use Smart Account TBA address for SpecialBox operations
  // SpecialBox should be minted to TBA from Smart Account, not EOA
  const addressToUse = smartAccountTbaAddress || tbaAddress || address;

  // Get user's current box balance - Updated to use Smart Account address
  // With token + subscriptions, we can reduce polling significantly
  const { data: userBoxes } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "boxBalance",
    args: [addressToUse],
    query: {
      enabled: !!addressToUse,
      refetchInterval: 60000, // 60s - Token eliminates rate limiting, mint events trigger updates
    },
    watch: false, // Disable watch to prevent continuous RPC calls
  });

  const specialBoxCount = Array.isArray(userBoxes) ? userBoxes.length : 0;
  const isLoading = mintHookLoading;

  // Enhanced Debug: Log TBA-related hamburger data dengan Smart Account
  console.log("=== SPECIALBOX SMART ACCOUNT TBA DEBUG ===");
  console.log("Address Information:");
  console.log("- EOA Address:", address);
  console.log("- Hook TBA Address:", tbaAddress);
  console.log("- Smart Account TBA Address:", smartAccountTbaAddress);
  console.log("- Address to Use:", addressToUse);
  console.log("- Using Smart Account TBA:", addressToUse === smartAccountTbaAddress);
  console.log("");
  console.log("Envio Data:");
  console.log("- Envio Loading:", envioLoading);
  console.log("");
  console.log("Hamburger Data:");
  console.log("- hamburgerCount (from TBA NFTs):", hamburgerCount);
  console.log("- hamburgerCost:", hamburgerCost);
  console.log("- canMintAmount:", canMintAmount);
  console.log("- maxMintable:", maxMintable);
  console.log("- isLoading:", isLoading);
  console.log("");
  console.log("Hook Validation:");
  console.log("- canMint:", canMint);
  console.log("- hasEnoughHamburgers(1):", hasEnoughHamburgers(1));
  console.log("- isValidAmount(1):", isValidAmount(1));
  console.log("");
  console.log("Box Data:");
  console.log("- specialBoxCount:", specialBoxCount);
  console.log("- userBoxes:", userBoxes);
  console.log("");
  console.log("Additional Debug Info:", debugInfo);
  console.log("==========================================");

  // Calculate progress and requirements using TBA hamburger count
  const requiredHamburgers = hamburgerCost;
  const hamburgersNeeded = Math.max(requiredHamburgers - hamburgerCount, 0);
  const progressPercentage = Math.min((hamburgerCount / requiredHamburgers) * 100, 100);
  const hamburgersToNextBox =
    hamburgerCount >= requiredHamburgers
      ? Math.max(requiredHamburgers - (hamburgerCount % requiredHamburgers), 0)
      : hamburgersNeeded;

  // Enhanced mint eligibility check using TBA-synchronized data
  const isEligibleToMint = () => {
    if (isLoading || !address || !tbaAddress) {
      console.log("Eligibility check failed: loading or no address/TBA");
      return false;
    }

    // Primary check: Direct hamburger count from TBA
    if (hamburgerCount < requiredHamburgers) {
      console.log(
        `TBA Eligibility check failed: hamburgerCount (${hamburgerCount}) < requiredHamburgers (${requiredHamburgers})`,
      );
      console.log(`- Using TBA Address: ${tbaAddress}`);
      return false;
    }

    // Secondary checks from hook
    if (canMintAmount <= 0) {
      console.log(`TBA Eligibility check failed: canMintAmount (${canMintAmount}) <= 0`);
      return false;
    }

    // Use hook validations as backup
    if (!hasEnoughHamburgers(1)) {
      console.log("TBA Eligibility check failed: hasEnoughHamburgers(1) returned false");
      return false;
    }

    if (!isValidAmount(1)) {
      console.log("TBA Eligibility check failed: isValidAmount(1) returned false");
      return false;
    }

    if (!canMint) {
      console.log(`TBA Eligibility check failed: canMint is ${canMint}`);
      return false;
    }

    console.log("TBA Eligibility check passed: User can mint using TBA address");
    return true;
  };

  const eligibleToMint = isEligibleToMint();

  // Handle single mint with enhanced validation
  const handleMint = async () => {
    if (!eligibleToMint || isLoading) {
      console.log("Mint blocked: not eligible or loading");
      return;
    }

    const mintAmount = 1;

    try {
      console.log("=== TBA MINT ATTEMPT DEBUG ===");
      console.log("- User Address:", address);
      console.log("- TBA Address:", tbaAddress);
      console.log("- Hamburger Count (from TBA):", hamburgerCount);
      console.log("- Required Hamburgers:", requiredHamburgers);
      console.log("- Can Mint Amount:", canMintAmount);
      console.log("- Max Mintable:", maxMintable);
      console.log("- Box Price:", boxPrice);
      console.log("- Box Price Wei:", boxPriceWei?.toString());
      console.log("- Eligible to Mint:", eligibleToMint);
      console.log("- Hook canMint:", canMint);
      console.log("- Hook hasEnoughHamburgers(1):", hasEnoughHamburgers(1));
      console.log("- Hook isValidAmount(1):", isValidAmount(1));

      // Final validation before minting
      if (hamburgerCount < requiredHamburgers) {
        console.error(
          `CRITICAL: TBA Hamburger count insufficient! TBA (${tbaAddress}) has: ${hamburgerCount}, Required: ${requiredHamburgers}`,
        );
        setShowFailModal(true);
        return;
      }

      // Attempt to mint using the hook function (calls mintBox() internally)
      console.log("Calling mint function with TBA data...");
      const result = await mint(mintAmount);
      console.log("TBA Mint result:", result);

      // Show success modal
      console.log("TBA Mint successful, showing success modal");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("=== TBA MINT ERROR ===");
      console.error("Error details:", error);
      console.error("TBA Address used:", tbaAddress);

      // Check if it's a specific contract error
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;

      if (typeof errorMessage === "string") {
        if (errorMessage.includes("Need 10 hamburgers") || errorMessage.includes("Not enough hamburgers")) {
          console.error("Contract rejected: Not enough hamburgers in TBA address");
          console.error(`- TBA Address: ${tbaAddress}`);
          console.error(`- TBA Hamburgers: ${hamburgerCount}`);
        } else if (errorMessage.includes("Insufficient payment")) {
          console.error("Contract rejected: Insufficient payment");
        } else {
          console.error("Unknown TBA mint error:", errorMessage);
        }
      } else {
        console.error("Unknown TBA mint error:", String(error));
      }

      setShowFailModal(true);
    }
  };

  // Handle mint all using TBA-synchronized validation
  const handleMintAll = async () => {
    if (!eligibleToMint || isLoading) {
      console.log("Mint all blocked: not eligible or loading");
      return;
    }

    // Calculate how many boxes can actually be minted from TBA
    const maxPossibleByTbaHamburgers = Math.floor(hamburgerCount / requiredHamburgers);
    const mintAmount = Math.min(canMintAmount, maxMintable, maxPossibleByTbaHamburgers);

    if (mintAmount <= 1) {
      // If only 1 or 0 boxes can be minted, use single mint instead
      if (mintAmount === 1) {
        return handleMint();
      } else {
        console.log("No boxes available for mint all");
        setShowFailModal(true);
        return;
      }
    }

    try {
      console.log("=== TBA MINT ALL ATTEMPT DEBUG ===");
      console.log("- User Address:", address);
      console.log("- TBA Address:", tbaAddress);
      console.log("- TBA Hamburger Count:", hamburgerCount);
      console.log("- Required per Box:", requiredHamburgers);
      console.log("- Max by TBA Hamburgers:", maxPossibleByTbaHamburgers);
      console.log("- Can Mint Amount:", canMintAmount);
      console.log("- Max Mintable per TX:", maxMintable);
      console.log("- Final Mint Amount:", mintAmount);
      console.log("- Total Hamburgers Needed:", mintAmount * requiredHamburgers);

      const totalHamburgersNeeded = mintAmount * requiredHamburgers;
      if (hamburgerCount < totalHamburgersNeeded) {
        console.error(`Not enough hamburgers in TBA: have ${hamburgerCount}, need ${totalHamburgersNeeded}`);
        console.error(`- TBA Address: ${tbaAddress}`);
        setShowFailModal(true);
        return;
      }

      console.log("Calling mintAll function with TBA data...");
      const result = await mintAll();
      console.log("TBA Mint all result:", result);

      console.log("TBA Mint all successful, showing success modal");
      setShowSuccessModal(true);
    } catch (error) {
      console.error("=== TBA MINT ALL ERROR ===");
      console.error("Error details:", error);
      console.error("TBA Address used:", tbaAddress);

      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;

      if (typeof errorMessage === "string") {
        if (errorMessage.includes("Need 10 hamburgers") || errorMessage.includes("Not enough hamburgers")) {
          console.error("Contract rejected: Not enough hamburgers in TBA");
        } else {
          console.error("Unknown TBA mint all error:", errorMessage);
        }
      } else {
        console.error("Unknown TBA mint all error:", error);
      }

      setShowFailModal(true);
    }
  };

  // Format price display
  const formatPrice = (price: string) => {
    if (!price || price === "0" || price === "0.0") return "FREE";

    try {
      const ethValue = parseFloat(price);
      return ethValue === 0 ? "FREE" : `${ethValue.toFixed(6)} ETH`;
    } catch {
      return "FREE";
    }
  };

  const getButtonText = () => {
    if (isLoading) return "LOADING...";
    if (!isConnected) return "CONNECT WALLET";
    if (!smartAccountTbaAddress) return "SMART ACCOUNT TBA NOT READY";

    // Use TBA-synchronized hamburger count
    if (hamburgerCount < requiredHamburgers) {
      return `NEED ${hamburgersNeeded} MORE HAMBURGERS`;
    }

    if (canMintAmount <= 0) {
      return "NO BOXES AVAILABLE";
    }

    const displayFee = formatPrice(boxPrice);
    const priceText = displayFee !== "FREE" ? ` (${displayFee})` : "";
    return `MINT SPECIAL BOX${priceText}`;
  };

  const getMintAllButtonText = () => {
    if (isLoading) return "LOADING...";
    if (canMintAmount <= 0) return "NO BOXES AVAILABLE";

    // Calculate actual mintable amount considering TBA hamburger count
    const maxPossibleByTbaHamburgers = Math.floor(hamburgerCount / requiredHamburgers);
    const actualMintAmount = Math.min(canMintAmount, maxMintable, maxPossibleByTbaHamburgers);

    if (actualMintAmount <= 0) return "NOT ENOUGH HAMBURGERS";
    if (actualMintAmount === 1) return "MINT 1 BOX";

    // Safe cost calculation with fallback
    let priceText = "";
    try {
      const cost = formatMintCost(actualMintAmount);
      if (cost && cost.ethCost && cost.ethCost !== "0.0") {
        priceText = ` (${cost.ethCost} ETH)`;
      } else if (boxPrice && boxPrice !== "0" && boxPrice !== "0.0") {
        // Fallback: calculate manually if formatMintCost fails
        const totalCost = parseFloat(boxPrice) * actualMintAmount;
        priceText = totalCost > 0 ? ` (${totalCost.toFixed(6)} ETH)` : "";
      }
    } catch (error) {
      console.warn("Error calculating mint cost:", error);
      // Fallback to manual calculation
      if (boxPrice && boxPrice !== "0" && boxPrice !== "0.0") {
        try {
          const totalCost = parseFloat(boxPrice) * actualMintAmount;
          priceText = totalCost > 0 ? ` (${totalCost.toFixed(6)} ETH)` : "";
        } catch (fallbackError) {
          console.warn("Fallback cost calculation also failed:", fallbackError);
          priceText = "";
        }
      }
    }

    return `MINT ALL ${actualMintAmount} BOXES${priceText}`;
  };

  // Show wallet connection warning
  if (!isConnected) {
    return (
      <WalletConnectionWarning
        className={`relative ${className} bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 rounded-2xl shadow-2xl border border-orange-400/30 backdrop-blur-sm`}
      />
    );
  }

  // Show loading state
  if (isLoading && hamburgerCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-4 rounded-2xl shadow-2xl border border-orange-400/30 backdrop-blur-sm">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
            <span className="ml-3 text-slate-400">Loading Special Box...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {/* Animated Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl blur-sm opacity-75 animate-pulse"></div>

        {/* Main Container */}
        <div className="relative bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 p-4 rounded-2xl shadow-2xl border border-orange-400/30 backdrop-blur-sm">
          {/* Header with TBA Info */}
          <div className="mb-4">
            <motion.h2
              className="text-lg font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2 flex items-center gap-2"
              animate={{
                textShadow: [
                  "0 0 10px rgba(251, 191, 36, 0.5)",
                  "0 0 20px rgba(251, 191, 36, 0.8)",
                  "0 0 10px rgba(251, 191, 36, 0.5)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="relative">
                <div className="absolute inset-0 w-3 h-3 bg-yellow-400 rounded-full blur-sm animate-ping"></div>
                <div className="relative w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
              </div>
              SPECIAL BOX
            </motion.h2>

            {/* TBA Address Indicator */}
            {smartAccountTbaAddress && smartAccountTbaAddress !== address && (
              <div className="text-xs text-slate-500 mb-2">
                Smart Account TBA: {smartAccountTbaAddress.slice(0, 6)}...{smartAccountTbaAddress.slice(-4)}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Hamburger Count - Now from TBA */}
            <motion.div
              className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 rounded-xl border border-yellow-400/30 relative overflow-hidden"
              whileHover={{ scale: 1.02, borderColor: "rgba(251, 191, 36, 0.6)" }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-yellow-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                    Hamburger {smartAccountTbaAddress !== address && "(Smart Account TBA)"}
                  </span>
                </div>
                <span className="font-bold text-yellow-400 text-lg">{hamburgerCount}</span>
              </div>
              {isLoading && (
                <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
                </div>
              )}
            </motion.div>

            {/* Special Box Count */}
            <motion.div
              className="bg-gradient-to-br from-slate-800 to-slate-700 p-3 rounded-xl border border-orange-400/30 relative overflow-hidden"
              whileHover={{ scale: 1.02, borderColor: "rgba(251, 146, 60, 0.6)" }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={14} className="text-orange-400" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">SpecialBox</span>
                </div>
                <span className="font-bold text-orange-400 text-lg">{specialBoxCount}</span>
              </div>
            </motion.div>
          </div>

          {/* Visual Display */}
          <div className="flex justify-center gap-4 mb-4">
            {/* Hamburger Display */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 bg-slate-800 rounded-xl border-2 border-yellow-400/30 flex items-center justify-center mb-1">
                <Image src="/assets/hamburger.png" width={50} height={50} alt="Hamburger" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-md font-bold">
                  {hamburgerCount}
                </span>
              </div>
              <span className="text-xs text-slate-400">HAMBURGER</span>
            </div>

            {/* Arrow */}
            <div className="flex items-center">
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-yellow-400 text-xl"
              >
                →
              </motion.div>
            </div>

            {/* Special Box Display */}
            <div className="flex flex-col items-center">
              <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl border-2 border-orange-400/30 flex items-center justify-center mb-1">
                <Image src="/assets/special-box.png" width={50} height={50} alt="Special Box" />
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-1.5 py-0.5 rounded-full shadow-md font-bold">
                  {specialBoxCount}
                </span>
              </div>
              <span className="text-xs text-slate-400">SPECIAL BOX</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>
                Progress: {hamburgerCount}/{requiredHamburgers}
              </span>
              <div className="flex gap-2">
                {canMintAmount > 0 && <span className="text-green-400">Available: {canMintAmount}</span>}
                {maxMintable < canMintAmount && <span className="text-yellow-400">Max/TX: {maxMintable}</span>}
                <span className="text-blue-400">Ready: {Math.floor(hamburgerCount / requiredHamburgers)}</span>
              </div>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              ></motion.div>
            </div>
            <p className="text-xs text-center text-slate-400">
              {hamburgersToNextBox > 0 && hamburgerCount >= requiredHamburgers
                ? `${hamburgersToNextBox} more for next box`
                : hamburgerCount < requiredHamburgers
                  ? `${hamburgersNeeded} more burgers needed`
                  : "Ready to mint!"}
            </p>
          </div>

          {/* Price Display */}
          {boxPriceWei && boxPriceWei > 0n && (
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-400/30">
                <Coins size={12} />
                <span>{formatPrice(boxPrice)}</span>
                <span className="text-xs opacity-75">per box</span>
              </div>
            </div>
          )}

          {/* Mint Buttons */}
          <div className="space-y-2">
            {/* Single Mint Button */}
            <motion.button
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                eligibleToMint && !isLoading
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-orange-500/25"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={handleMint}
              disabled={!eligibleToMint || isLoading}
              whileHover={eligibleToMint && !isLoading ? { scale: 1.02 } : {}}
              whileTap={eligibleToMint && !isLoading ? { scale: 0.98 } : {}}
            >
              {isMintLoading || isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  MINTING...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {getButtonText()}
                </>
              )}
            </motion.button>

            {/* Mint All Button - Show only if more than 1 box can be minted */}
            {canMintAmount > 1 && Math.floor(hamburgerCount / requiredHamburgers) > 1 && (
              <motion.button
                className={`w-full py-2 px-4 rounded-xl font-medium text-xs transition-all duration-200 flex items-center justify-center gap-2 ${
                  eligibleToMint && !isLoading && Math.floor(hamburgerCount / requiredHamburgers) > 1
                    ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                onClick={handleMintAll}
                disabled={!eligibleToMint || isLoading || Math.floor(hamburgerCount / requiredHamburgers) <= 1}
                whileHover={eligibleToMint && !isLoading ? { scale: 1.01 } : {}}
                whileTap={eligibleToMint && !isLoading ? { scale: 0.99 } : {}}
              >
                {isMintLoading || isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    MINTING ALL...
                  </>
                ) : (
                  <>
                    <Gift className="w-3 h-3" />
                    {getMintAllButtonText()}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Modals with higher z-index to appear above gameboard */}
      <div className="relative z-[9999]">
        <SpecialBoxModals
          showModal={showFailModal}
          showSuccessModal={showSuccessModal}
          setShowModal={setShowFailModal}
          setShowSuccessModal={setShowSuccessModal}
          hamburgerCount={hamburgerCount}
          specialBoxCount={specialBoxCount}
        />
      </div>
    </>
  );
};
