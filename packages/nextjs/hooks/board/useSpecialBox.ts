import { useCallback, useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface UseSpecialBoxProps {
  tbaAddress?: string;
  onMintSuccess?: (tokenId: bigint) => void;
  onBurnSuccess?: (tokenId: bigint) => void;
}

export const useSpecialBox = ({ tbaAddress, onMintSuccess, onBurnSuccess }: UseSpecialBoxProps = {}) => {
  const { address, isConnected } = useAccount();

  // State management
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Write contract hook
  const { writeContractAsync: writeSpecialBoxAsync } = useScaffoldWriteContract({
    contractName: "SpecialBox",
  });

  // Read contract hooks - Get user's TBA address
  const { data: userTBA } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "getTBA",
    args: [address],
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Use provided TBA address or fallback to user's TBA
  const effectiveTbaAddress = tbaAddress || userTBA;

  // Read contract hooks - Box balance
  const { data: boxBalance, refetch: refetchBoxBalance } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "boxBalance",
    args: [effectiveTbaAddress as `0x${string}`],
    query: {
      enabled: !!effectiveTbaAddress && isConnected,
    },
  });

  // Read contract hooks - Check if has enough hamburgers
  const { data: hasEnoughHamburgers } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "hasEnoughHamburgers",
    args: [effectiveTbaAddress as `0x${string}`],
    query: {
      enabled: !!effectiveTbaAddress && isConnected,
    },
  });

  // Read contract hooks - Check how many boxes can be minted
  const { data: canMintCount } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "canMint",
    args: [effectiveTbaAddress as `0x${string}`],
    query: {
      enabled: !!effectiveTbaAddress && isConnected,
    },
  });

  // Read contract hooks - Get box price
  const { data: boxPrice } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "getBoxPrice",
  });

  // Read contract hooks - Get mint cost
  const { data: mintCost } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "getMintCost",
  });

  // Read contract hooks - Total supply
  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SpecialBox",
    functionName: "total",
  });

  // Mint box function
  const mintBox = useCallback(async () => {
    if (!isConnected || !address || !effectiveTbaAddress) {
      setError("Wallet not connected or TBA not available");
      return false;
    }

    if (!hasEnoughHamburgers) {
      setError("Need at least 10 hamburgers to mint a box");
      return false;
    }

    try {
      setIsMinting(true);
      setError(null);

      console.log("Minting Special Box...", {
        user: address,
        tba: effectiveTbaAddress,
        hasEnoughHamburgers,
        boxPrice,
        mintCost,
      });

      const result = await writeSpecialBoxAsync({
        functionName: "mintBox",
        value: mintCost || 0n,
      });

      if (result) {
        console.log("Special Box minted successfully:", result);

        // Refetch box balance
        await refetchBoxBalance();

        // Extract token ID from transaction result if possible
        // Note: This might need adjustment based on how the transaction result is structured
        const tokenId = BigInt(1); // Placeholder - would need proper extraction from tx result

        notification.success("Special Box minted successfully!");

        if (onMintSuccess) {
          onMintSuccess(tokenId);
        }

        return result;
      }
    } catch (error: any) {
      console.error("Failed to mint Special Box:", error);

      let errorMessage = "Failed to mint Special Box";
      if (error.message) {
        if (error.message.includes("Need 10 hamburgers")) {
          errorMessage = "You need at least 10 hamburgers to mint a Special Box";
        } else if (error.message.includes("Insufficient payment")) {
          errorMessage = "Insufficient payment for minting";
        } else if (error.message.includes("Payment gateway not set")) {
          errorMessage = "Payment gateway not configured";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      notification.error(`Mint Failed: ${errorMessage}`);
      return false;
    } finally {
      setIsMinting(false);
    }
  }, [
    isConnected,
    address,
    effectiveTbaAddress,
    hasEnoughHamburgers,
    boxPrice,
    mintCost,
    writeSpecialBoxAsync,
    refetchBoxBalance,
    onMintSuccess,
  ]);

  // Burn box function (admin only)
  const burnBox = useCallback(
    async (tokenId: bigint) => {
      if (!isConnected || !address) {
        setError("Wallet not connected");
        return false;
      }

      try {
        setIsBurning(true);
        setError(null);

        console.log("Burning Special Box...", {
          tokenId: tokenId.toString(),
          user: address,
        });

        const result = await writeSpecialBoxAsync({
          functionName: "burnBox",
          args: [tokenId],
        });

        if (result) {
          console.log("Special Box burned successfully:", result);

          // Refetch box balance
          await refetchBoxBalance();

          notification.success("Special Box burned successfully!");

          if (onBurnSuccess) {
            onBurnSuccess(tokenId);
          }

          return result;
        }
      } catch (error: any) {
        console.error("Failed to burn Special Box:", error);

        let errorMessage = "Failed to burn Special Box";
        if (error.message) {
          if (error.message.includes("Not authorized")) {
            errorMessage = "You are not authorized to burn boxes";
          } else if (error.message.includes("Box not exist")) {
            errorMessage = "Box does not exist";
          } else {
            errorMessage = error.message;
          }
        }

        setError(errorMessage);
        notification.error(`Burn Failed: ${errorMessage}`);
        return false;
      } finally {
        setIsBurning(false);
      }
    },
    [isConnected, address, writeSpecialBoxAsync, refetchBoxBalance, onBurnSuccess],
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check if user can mint
  const canMint = hasEnoughHamburgers && !isMinting;

  // Get box count
  const boxCount = boxBalance ? boxBalance.length : 0;

  // Format box price for display
  const formatBoxPrice = (price: bigint | undefined) => {
    if (!price) return "0 ETH";
    const eth = Number(price) / 1e18;
    return `${eth} ETH`;
  };

  return {
    // State
    isMinting,
    isBurning,
    error,

    // Data
    boxBalance: boxBalance || [],
    boxCount,
    hasEnoughHamburgers: hasEnoughHamburgers || false,
    canMintCount: canMintCount || 0n,
    boxPrice: boxPrice || 0n,
    mintCost: mintCost || 0n,
    totalSupply: totalSupply || 0n,
    userTBA: effectiveTbaAddress,

    // Computed values
    canMint,
    formattedBoxPrice: formatBoxPrice(boxPrice),
    formattedMintCost: formatBoxPrice(mintCost),

    // Actions
    mintBox,
    burnBox,
    clearError,
    refetchBoxBalance,

    // Debug info
    debug: {
      isConnected,
      address,
      tbaAddress,
      effectiveTbaAddress,
      hasEnoughHamburgers,
      boxPrice,
      mintCost,
    },
  };
};
