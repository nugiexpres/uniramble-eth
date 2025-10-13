import { useCallback, useState } from "react";
import { useFoodScrambleData } from "./useFoodScrambleData";
import { useGaslessGameActions } from "./useGaslessGameActions";
import { useEIP7702Delegation } from "~~/hooks/EIP7702/useEIP7702Delegation";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import {
  emitBuyEvent,
  emitCookEvent,
  emitFaucetEvent,
  emitRailEvent,
  emitRollEvent,
} from "~~/utils/envio/emitGameEvent";
import { notification } from "~~/utils/scaffold-eth";

interface UseActionBoardProps {
  tbaAddress?: string;
}

export const useActionBoard = ({ tbaAddress }: UseActionBoardProps) => {
  const [isModalOpen] = useState(false);
  const [modalMessage] = useState("");
  const [buyError, setBuyError] = useState<string | null>(null);

  // Use gasless game actions
  const {
    isRolling,
    isBuying,
    isRailTraveling,
    isCooking,
    isUsingFaucet,
    error: gaslessError,
    handleRoll: gaslessHandleRoll,
    handleBuy: gaslessHandleBuy,
    handleRail: gaslessHandleRail,
    handleCook: gaslessHandleCook,
    handleFaucetMon: gaslessHandleFaucetMon,
    isSmartAccountDeployed,
    smartAccountAddress,
    userTBA,
  } = useGaslessGameActions();

  // Get real game data from useFoodScrambleData with Smart Account TBA
  const {
    playerPosition: realPlayerPosition,
    canBuy: realCanBuy,
    ingredientFee: realIngredientFee,
    randomRollResult,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
    // Envio data
    envio: {
      playerPosition: envioPlayerPosition,
      positions: envioPositions,
      latestPositions,
      ingredientPurchases,
      specialBoxMints,
      loading: envioLoading,
    },
    // Smart Account info
    smartAccount: { tbaAddress: smartAccountTbaAddress, effectiveAddress, usingSmartAccountTBA },
  } = useFoodScrambleData({
    address: isSmartAccountDeployed && smartAccountAddress ? smartAccountAddress : undefined,
    enableWatch: true,
  });

  // EIP-7702 delegation hook
  const { executeGameAction, isLoading: isDelegationLoading } = useEIP7702Delegation();

  // Scaffold-ETH write contract hooks
  const { writeContractAsync: writeFoodScrambleAsync } = useScaffoldWriteContract({
    contractName: "FoodScramble",
  });

  // Roll dice action - Use gasless if smart account is deployed
  const handleRoll = useCallback(async () => {
    // ✅ Check TBA exists before rolling - show clear error to user
    if (!tbaAddress || tbaAddress === "0x0000000000000000000000000000000000000000") {
      const errorMsg =
        "❌ TBA not found! Please create your Token Bound Account first by minting a Chef NFT and creating TBA.";
      console.error("TBA validation failed:", { tbaAddress, smartAccountAddress });
      setBuyError(errorMsg);
      notification.error(errorMsg);
      return;
    }

    try {
      setBuyError(null);
      console.log("Starting roll dice...");

      if (isSmartAccountDeployed && smartAccountAddress) {
        // Use gasless transaction
        console.log("Using gasless transaction for roll:", {
          isSmartAccountDeployed,
          smartAccountAddress,
          gaslessHandleRoll: typeof gaslessHandleRoll,
        });
        const success = await gaslessHandleRoll();
        if (success) {
          console.log("Dice rolled successfully with gasless!");

          // Emit event for EnvioAnalytics (optimistic UI update)
          const newPosition = (realPlayerPosition || 0) + (randomRollResult || 0);
          emitRollEvent(tbaAddress, newPosition);

          // Optimisasi: refetch lebih cepat untuk respons instan
          await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
          // Additional refetch after short delay for Envio data sync
          setTimeout(async () => {
            await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
          }, 100); // Reduced delay for faster response
        } else {
          console.warn("Gasless roll in progress...");
        }
      } else if (executeGameAction) {
        // Use EIP-7702 delegation
        console.log("Using EIP-7702 delegation");
        const success = await executeGameAction("movePlayer", []);
        if (success) {
          console.log("Dice rolled successfully with EIP-7702!");
          // Refetch player position and random roll after successful roll
          await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
        } else {
          throw new Error("EIP-7702 delegation failed");
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call");
        await writeFoodScrambleAsync({
          functionName: "movePlayer",
        });
        console.log("Dice rolled successfully with direct call!");
        // Refetch player position and random roll after successful roll
        await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
      }
    } catch (error: any) {
      console.error("Roll error:", error);
      const errorMessage = error.message || "Failed to roll dice";
      console.error("Roll failed:", errorMessage);
      setBuyError(errorMessage);
    } finally {
      console.log("Roll dice completed");
    }
  }, [
    tbaAddress,
    isSmartAccountDeployed,
    smartAccountAddress,
    gaslessHandleRoll,
    executeGameAction,
    writeFoodScrambleAsync,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
  ]);

  // Buy ingredient action - Use gasless if smart account is deployed
  const handleBuy = useCallback(async () => {
    if (!tbaAddress) {
      console.error("TBA address not found");
      return;
    }

    try {
      setBuyError(null);
      console.log("Starting buy ingredient...");

      if (isSmartAccountDeployed && smartAccountAddress) {
        // Use gasless transaction
        console.log("Using gasless transaction for buy");
        const success = await gaslessHandleBuy();
        if (success) {
          console.log("Ingredient purchased successfully with gasless!");

          // Emit event for EnvioAnalytics (optimistic UI update)
          const ingredientType = realPlayerPosition ? realPlayerPosition % 4 : 0;
          const fee = Number(realIngredientFee || 0n) / 1e18;
          emitBuyEvent(tbaAddress, ingredientType, fee);

          // Optimisasi: Envio akan update otomatis, tidak perlu refetch manual
        }
      } else if (executeGameAction) {
        // Use EIP-7702 delegation
        console.log("Using EIP-7702 delegation for buy");
        const success = await executeGameAction("buyIngredient", []);
        if (success) {
          console.log("Ingredient purchased successfully with EIP-7702!");
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call for buy");
        await writeFoodScrambleAsync({
          functionName: "buyIngredient",
        });
        console.log("Ingredient purchased successfully with direct call!");
      }
    } catch (error: any) {
      console.error("Buy error:", error);
      const errorMessage = error.message || "Failed to buy ingredient";
      console.error("Buy failed:", errorMessage);
      setBuyError(errorMessage);
    } finally {
      console.log("Buy ingredient completed");
    }
  }, [
    tbaAddress,
    isSmartAccountDeployed,
    smartAccountAddress,
    gaslessHandleBuy,
    executeGameAction,
    writeFoodScrambleAsync,
  ]);

  // Rail travel action - Use gasless if smart account is deployed
  const handleRail = useCallback(async () => {
    if (!tbaAddress) {
      console.error("TBA address not found");
      return;
    }

    try {
      console.log("Starting rail travel...");

      if (isSmartAccountDeployed && smartAccountAddress) {
        // Use gasless transaction
        console.log("Using gasless transaction for rail");
        const success = await gaslessHandleRail();
        if (success) {
          console.log("Rail travel completed with gasless!");

          // Emit event for EnvioAnalytics (optimistic UI update)
          const newPosition = (realPlayerPosition || 0) + 5;
          emitRailEvent(tbaAddress, newPosition);
        }
      } else if (executeGameAction) {
        // Use EIP-7702 delegation
        console.log("Using EIP-7702 delegation for rail");
        const success = await executeGameAction("travelRail", []);
        if (success) {
          console.log("Rail travel completed with EIP-7702!");
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call for rail");
        await writeFoodScrambleAsync({
          functionName: "travelRail",
        });
        console.log("Rail travel completed with direct call!");
      }
    } catch (error: any) {
      console.error("Rail error:", error);
      const errorMessage = error.message || "Failed to travel by rail";
      console.error("Rail travel failed:", errorMessage);
      setBuyError(errorMessage);
    } finally {
      console.log("Rail travel completed");
    }
  }, [
    tbaAddress,
    isSmartAccountDeployed,
    smartAccountAddress,
    gaslessHandleRail,
    executeGameAction,
    writeFoodScrambleAsync,
  ]);

  // Cook food action - Use gasless if smart account is deployed
  const handleCook = useCallback(async () => {
    if (!tbaAddress) {
      console.error("TBA address not found");
      return;
    }

    try {
      console.log("Starting cook food...");

      if (isSmartAccountDeployed && smartAccountAddress) {
        // Use gasless transaction
        console.log("Using gasless transaction for cook");
        const success = await gaslessHandleCook();
        if (success) {
          console.log("Food cooked successfully with gasless!");

          // Emit event for EnvioAnalytics (optimistic UI update)
          emitCookEvent(tbaAddress, 1);
        }
      } else if (executeGameAction) {
        // Use EIP-7702 delegation
        console.log("Using EIP-7702 delegation for cook");
        const success = await executeGameAction("mintFoodNFT", []);
        if (success) {
          console.log("Food cooked successfully with EIP-7702!");
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call for cook");
        await writeFoodScrambleAsync({
          functionName: "mintFoodNFT",
        });
        console.log("Food cooked successfully with direct call!");
      }
    } catch (error: any) {
      console.error("Cook error:", error);
      const errorMessage = error.message || "Failed to cook food";
      console.error("Cook failed:", errorMessage);
      setBuyError(errorMessage);
    } finally {
      console.log("Cook food completed");
    }
  }, [
    tbaAddress,
    isSmartAccountDeployed,
    smartAccountAddress,
    gaslessHandleCook,
    executeGameAction,
    writeFoodScrambleAsync,
  ]);

  // Faucet action - Use gasless if smart account is deployed
  const handleFaucetMon = useCallback(
    async (isOnStove: boolean) => {
      if (!tbaAddress) {
        console.error("TBA address not found");
        return;
      }

      try {
        console.log("Starting faucet...");

        if (isSmartAccountDeployed && smartAccountAddress) {
          // Use gasless transaction
          console.log("Using gasless transaction for faucet");
          const success = await gaslessHandleFaucetMon(isOnStove);
          if (success) {
            console.log("Faucet used successfully with gasless!");

            // Emit event for EnvioAnalytics (optimistic UI update)
            emitFaucetEvent(tbaAddress, "0.01");
          }
        } else if (executeGameAction) {
          // Use EIP-7702 delegation
          console.log("Using EIP-7702 delegation for faucet");
          const success = await executeGameAction("useFaucetMon", []);
          if (success) {
            console.log("Faucet used successfully with EIP-7702!");
          }
        } else {
          // Use direct contract call
          console.log("Using direct contract call for faucet");
          await writeFoodScrambleAsync({
            functionName: "useFaucetMon",
          });
          console.log("Faucet used successfully with direct call!");
        }
      } catch (error: any) {
        console.error("Faucet error:", error);
        const errorMessage = error.message || "Failed to use faucet";
        console.error("Faucet failed:", errorMessage);
        setBuyError(errorMessage);
      } finally {
        console.log("Faucet completed");
      }
    },
    [
      tbaAddress,
      isSmartAccountDeployed,
      smartAccountAddress,
      gaslessHandleFaucetMon,
      executeGameAction,
      writeFoodScrambleAsync,
    ],
  );

  // Use real data from useFoodScrambleData
  const faucetUsed = false; // This would come from contract data - TODO: implement faucet usage tracking
  const canBuy = realCanBuy;
  const playerPosition = realPlayerPosition;
  const effectivePosition = realPlayerPosition; // For now, same as player position
  const ingredientFee = realIngredientFee?.toString() || "0";

  // Debug logging for player position
  console.log("useActionBoard Debug:", {
    isSmartAccountDeployed,
    smartAccountAddress,
    playerPosition: realPlayerPosition,
    canBuy: realCanBuy,
    usingSmartAccount: isSmartAccountDeployed && smartAccountAddress,
  });

  return {
    // Modal state
    isModalOpen,
    modalMessage,

    // Action states (from gasless actions)
    isRolling,
    isBuying,
    isRailTraveling,
    isCooking,
    isUsingFaucet,
    buyError: buyError || gaslessError,

    // Game state (real data from useFoodScrambleData)
    faucetUsed,
    canBuy,
    playerPosition,
    effectivePosition,
    ingredientFee,
    randomRollResult,

    // Action handlers
    handleRoll,
    handleBuy,
    handleRail,
    handleCook,
    handleFaucetMon,

    // EIP-7702 state
    isDelegationActive: !!executeGameAction,
    isDelegationLoading,

    // Smart Account state
    isSmartAccountDeployed,
    smartAccountAddress,
    userTBA,

    // Envio data (faster access)
    envio: {
      playerPosition: envioPlayerPosition,
      positions: envioPositions,
      latestPositions,
      ingredientPurchases,
      specialBoxMints,
      loading: envioLoading,
    },

    // Smart Account TBA info
    smartAccountTbaAddress,
    effectiveAddress,
    usingSmartAccountTBA,
  };
};
