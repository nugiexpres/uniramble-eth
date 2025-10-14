import { useState } from "react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useGameData } from "~~/hooks/board/useGameData";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface UseSpecialBoxMintProps {
  contractName?: "SpecialBox";
}

interface MintCost {
  ethCost: bigint;
  hamburgersNeeded: bigint;
}

export const useSpecialBoxMint = ({ contractName = "SpecialBox" }: UseSpecialBoxMintProps = {}) => {
  const { address } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get game data which includes TBA address
  const { tbaAddress, refetchSafeFoodNfts } = useGameData(address);

  // Use TBA address for SpecialBox operations (not Smart Account address)
  // SpecialBox should be minted to TBA, not Smart Account
  const tbaAddressToUse = tbaAddress || address;

  // Get food NFTs directly from TBA address using FoodNFT contract
  const { data: tbaFoodNfts, refetch: refetchTbaFoodNfts } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "getMyFoods",
    args: [tbaAddressToUse],
    query: {
      refetchInterval: 60000, // 60s - Token eliminates rate limiting
    },
    watch: false,
  });

  // Read contract data - updated to match new contract
  const { data: boxPrice } = useScaffoldReadContract({
    contractName,
    functionName: "getBoxPrice", // Use getBoxPrice function
    query: {
      refetchInterval: 60000, // Static data, refetch every 60s
    },
    watch: false,
  });

  const { data: hamburgerCost } = useScaffoldReadContract({
    contractName,
    functionName: "HAMBURGER_COST",
  });

  // Get contract's canMint for validation - now expects TBA address
  const { data: contractCanMint, isLoading: hamburgerCountLoading } = useScaffoldReadContract({
    contractName: contractName,
    functionName: "canMint",
    args: [tbaAddressToUse], // Changed to use TBA address instead of user address
    query: {
      refetchInterval: 60000, // 60s - Token eliminates rate limiting
    },
    watch: false,
  });

  // Calculate how many boxes can be minted based on actual hamburger count
  const actualHamburgerCount = tbaFoodNfts?.length || 0;
  const calculatedCanMint = hamburgerCost ? Math.floor(actualHamburgerCount / Number(hamburgerCost)) : 0;

  // Use contract result as primary since it now correctly uses TBA
  const canMintAmount = contractCanMint ? Number(contractCanMint) : calculatedCanMint;

  // Calculate maximum mintable in one transaction (since contract only mints 1 at a time, we'll simulate batch)
  const maxMintable = canMintAmount;

  // Get mint cost for specific amount
  const getMintCost = (amount: number): MintCost | null => {
    if (!boxPrice || !hamburgerCost) return null;

    return {
      ethCost: boxPrice * BigInt(amount), // boxPrice is per box from getBoxPrice()
      hamburgersNeeded: hamburgerCost * BigInt(amount),
    };
  };

  // Write functions - updated to use new contract function
  const { writeContractAsync: mintBoxWrite, isPending: isMintBoxLoading } = useScaffoldWriteContract("SpecialBox");

  // Add function to get box balance for debugging
  const { data: contractBoxBalance } = useScaffoldReadContract({
    contractName,
    functionName: "boxBalance",
    args: [tbaAddressToUse],
    query: {
      refetchInterval: 60000, // 60s - Token eliminates rate limiting
    },
    watch: false,
  });

  // Validation functions - using calculated values instead of contract
  const hasEnoughHamburgers = (amount: number): boolean => {
    if (!hamburgerCost || !actualHamburgerCount) return false;
    const requiredHamburgers = Number(hamburgerCost) * amount;
    return actualHamburgerCount >= requiredHamburgers;
  };

  const isValidAmount = (amount: number): boolean => {
    if (amount <= 0) return false;
    if (amount > canMintAmount) return false;
    return hasEnoughHamburgers(amount);
  };

  // Mint specific amount - now calls mintBox() multiple times
  const mint = async (amount: number) => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    if (!isValidAmount(amount)) {
      if (!hasEnoughHamburgers(amount)) {
        notification.error(`Not enough hamburgers. You can mint ${canMintAmount} boxes maximum`);
      } else {
        notification.error("Invalid mint amount");
      }
      return;
    }

    const cost = getMintCost(amount);
    if (!cost) {
      notification.error("Unable to calculate mint cost");
      return;
    }

    try {
      setIsProcessing(true);

      console.log("Minting with TBA data:");
      console.log("- User Address:", address);
      console.log("- TBA Address:", tbaAddressToUse);
      console.log("- Amount:", amount);
      console.log("- Can Mint Amount:", canMintAmount);
      console.log("- Required Hamburgers:", cost.hamburgersNeeded.toString());
      console.log("- ETH Cost:", formatEther(cost.ethCost));

      // Since contract only mints one box at a time, we need to call mintBox() multiple times
      const transactions = [];
      const ethCostPerBox = boxPrice || 0n;

      for (let i = 0; i < amount; i++) {
        const tx = await mintBoxWrite({
          functionName: "mintBox",
          value: ethCostPerBox as bigint, // ETH payment for each box
        });
        transactions.push(tx);
      }

      // Refetch both user and TBA food data after successful mint
      await Promise.all([refetchSafeFoodNfts(), refetchTbaFoodNfts()]);

      notification.success(`Successfully minted ${amount} Special Box(es)!`);

      return transactions;
    } catch (error: any) {
      console.error("Mint failed:", error);
      notification.error(error?.message || "Mint failed");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Mint all available boxes
  const mintAll = async () => {
    if (!address) {
      notification.error("Please connect your wallet");
      return;
    }

    const actualMintAmount = maxMintable;

    if (actualMintAmount <= 0) {
      notification.error("No boxes available to mint");
      return;
    }

    if (!hasEnoughHamburgers(actualMintAmount)) {
      notification.error(`Not enough hamburgers to mint ${actualMintAmount} box(es)`);
      return;
    }

    const cost = getMintCost(actualMintAmount);
    if (!cost) {
      notification.error("Unable to calculate mint cost");
      return;
    }

    try {
      setIsProcessing(true);

      console.log("Minting all with TBA data:");
      console.log("- User Address:", address);
      console.log("- TBA Address:", tbaAddressToUse);
      console.log("- Amount:", actualMintAmount);
      console.log("- Can Mint Amount:", canMintAmount);
      console.log("- Required Hamburgers:", cost.hamburgersNeeded.toString());
      console.log("- ETH Cost:", formatEther(cost.ethCost));

      // Mint all boxes one by one
      const transactions = [];
      const ethCostPerBox = boxPrice || 0n;

      for (let i = 0; i < actualMintAmount; i++) {
        const tx = await mintBoxWrite({
          functionName: "mintBox",
          value: ethCostPerBox as bigint, // ETH payment for each box
        });
        transactions.push(tx);
      }

      // Refetch both user and TBA food data after successful mint
      await Promise.all([refetchSafeFoodNfts(), refetchTbaFoodNfts()]);

      notification.success(`Successfully minted all ${actualMintAmount} Special Boxes!`);

      return transactions;
    } catch (error: any) {
      console.error("Mint all failed:", error);
      notification.error(error?.message || "Mint all failed");
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper functions
  const formatMintCost = (amount: number) => {
    const cost = getMintCost(amount);
    if (!cost) return null;

    return {
      ethCost: formatEther(cost.ethCost),
      hamburgersNeeded: cost.hamburgersNeeded.toString(),
      ethCostWei: cost.ethCost,
    };
  };

  // Debug information
  const debugInfo = {
    userAddress: address,
    tbaAddress: tbaAddressToUse,
    tbaFoodNfts: tbaFoodNfts?.length || 0,
    actualHamburgerCount,
    calculatedCanMint,
    contractCanMint: contractCanMint ? Number(contractCanMint) : 0,
    hamburgerCost: hamburgerCost ? Number(hamburgerCost) : 10,
    maxMintable,
    boxPrice: boxPrice ? formatEther(boxPrice) : "0",
    contractBoxBalance: contractBoxBalance?.length || 0,
    contractBoxes: contractBoxBalance || [],
    validationResults: {
      hasEnough1: hasEnoughHamburgers(1),
      isValid1: isValidAmount(1),
      canMintCheck: canMintAmount > 0,
    },
  };

  console.log("useSpecialBoxMint TBA Debug:", debugInfo);

  return {
    // Data - using contract values that now properly work with TBA
    canMintAmount,
    maxMintable,
    boxPrice: boxPrice ? formatEther(boxPrice) : "0",
    boxPriceWei: boxPrice || 0n,
    hamburgerCost: hamburgerCost ? Number(hamburgerCost) : 10,
    hamburgerCount: actualHamburgerCount, // Use actual TBA food NFTs count
    tbaAddress: tbaAddressToUse, // Expose TBA address being used

    // Functions
    mint,
    mintAll,
    getMintCost,
    formatMintCost,
    refetchSafeFoodNfts, // Expose refetch function

    // Status
    isLoading: isMintBoxLoading || isProcessing || hamburgerCountLoading,
    isMintLoading: isMintBoxLoading,
    isMintAllLoading: isMintBoxLoading, // Same as individual mint since we're calling it multiple times
    isProcessing,

    // Validation helpers
    canMint: canMintAmount > 0,
    hasEnoughHamburgers,
    isValidAmount,

    // Debug
    debugInfo,
    contractBoxBalance, // Add this to expose contract box balance
  };
};
