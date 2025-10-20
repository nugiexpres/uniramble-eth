import { useCallback, useState } from "react";
import { useFoodScrambleData } from "./useFoodScrambleData";
import { useGaslessGameActions } from "./useGaslessGameActions";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
// import {
// emitBuyEvent,
// emitCookEvent,
// emitFaucetEvent,
// emitRailEvent,
// emitRollEvent,
// } from "~~/utils/envio/emitGameEvent";
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

  // Scaffold-ETH write contract hooks
  const { writeContractAsync: writeFoodScrambleAsync } = useScaffoldWriteContract({
    contractName: "FoodScramble",
  });

  // Note: ingredientTypeAtPosition is available from the contract at realPlayerPosition
  // but we don't need a separate hook for it since it's only used in the non-gasless buy path
  // and can be retrieved directly from Envio data

  // Roll dice action - Check delegation first
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

      // Check for Smart Account gasless (Biconomy)
      if (isSmartAccountDeployed && smartAccountAddress) {
        console.log("SMART ACCOUNT MODE: Executing gasless transaction.");
        notification.info("Rolling dice gaslessly...");

        const success = await gaslessHandleRoll();

        if (success) {
          console.log("Gasless roll executed on-chain");

          // Wait for Envio to index the real blockchain event
          setTimeout(async () => {
            try {
              // Get real data from Envio indexer
              // latestPositions is an array, find the one for this player
              const playerMove = latestPositions.find(
                p => p.player.toLowerCase() === (effectiveAddress || "").toLowerCase(),
              );
              if (playerMove) {
                const gridNumber = playerMove.newPosition + 1;
                notification.success(`Rolled and moved to grid ${gridNumber}! (Real-time update)`);
              } else {
                // Fallback to contract data if Envio not ready
                const rollResult = randomRollResult || Math.floor(Math.random() * 6) + 1;
                const newPosition = realPlayerPosition || 0;
                const gridNumber = newPosition + 1;
                notification.success(`Rolled ${rollResult}! Moved to grid ${gridNumber}!`);
              }
            } catch (error) {
              console.error("Error getting real roll data:", error);
            }
          }, 2000); // Wait 2 seconds for Envio indexing

          // Refetch to get REAL blockchain data
          await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
        }
        return; // EXIT - Already executed gaslessly
      }

      // Fallback: Standard execution with wallet signature
      console.log("NO SMART ACCOUNT - Using wallet signature");
      await writeFoodScrambleAsync({
        functionName: "movePlayer",
      });
      console.log("Dice rolled successfully with direct call!");

      const rollResult = randomRollResult || Math.floor(Math.random() * 6) + 1;
      const newPosition = realPlayerPosition || 0;
      notification.success(`Rolled ${rollResult}! Moved to grid ${newPosition + 1}!`);

      await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
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
    writeFoodScrambleAsync,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
    effectiveAddress,
    latestPositions,
    randomRollResult,
    realPlayerPosition,
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

          // Wait for Envio to index the real blockchain event
          setTimeout(async () => {
            try {
              // Prefer latest on-chain purchase for this TBA
              const latestPurchase = [...ingredientPurchases]
                .reverse()
                .find((p: any) => p.player.toLowerCase() === userTBA?.toLowerCase());
              if (latestPurchase) {
                const ingredientNames = ["Bread", "Meat", "Lettuce", "Tomato"];
                const ingredientName = ingredientNames[Number(latestPurchase.ingredientType)] || "Unknown Ingredient";
                const position = latestPurchase.position !== undefined ? latestPurchase.position + 1 : undefined;
                const gridMsg = position !== undefined ? ` at grid ${position}` : "";
                notification.success(`Bought ${ingredientName}${gridMsg}! (Real on-chain data from Envio)`);
              } else {
                // Fallback - generic message when Envio data not ready yet
                notification.success(`Bought ingredient at grid ${(realPlayerPosition || 0) + 1}!`);
              }
            } catch (error) {
              console.error("Error getting real buy data:", error);
            }
          }, 2000); // Wait 2 seconds for Envio indexing

          // NO local event emission - Envio indexer will catch real blockchain event
          // Envio akan update otomatis
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call for buy");
        await writeFoodScrambleAsync({
          functionName: "buyIngredient",
        });
        console.log("Ingredient purchased successfully with direct call!");

        // Use generic success message for direct contract calls
        // (ingredient type detection is handled by Envio in gasless mode)
        notification.success(`Bought ingredient at grid ${(realPlayerPosition || 0) + 1}!`);
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
    writeFoodScrambleAsync,
    ingredientPurchases,
    realPlayerPosition,
    userTBA,
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

          // NO local event emission - Envio indexer will catch real blockchain event
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
  }, [tbaAddress, isSmartAccountDeployed, smartAccountAddress, gaslessHandleRail, writeFoodScrambleAsync]);

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

          // Wait for Envio to index the real blockchain event
          setTimeout(async () => {
            try {
              // Get real hamburger mint data from Envio indexer
              const latestMint = specialBoxMints.find((m: any) => m.player === userTBA);
              if (latestMint) {
                notification.success(
                  `Minted Hamburger NFT #${latestMint.id}! Event: minted hamburger (Real on-chain data from Envio)`,
                );
              } else {
                // Fallback notification if Envio not ready
                notification.success(`Minted Hamburger NFT! Event: minted hamburger`);
              }
            } catch (error) {
              console.error("Error getting real cook data:", error);
              notification.success(`Minted Hamburger NFT! Event: minted hamburger`);
            }
          }, 2000); // Wait 2 seconds for Envio indexing

          // NO local event emission - Envio indexer will catch real blockchain event
        }
      } else {
        // Use direct contract call
        console.log("Using direct contract call for cook");
        await writeFoodScrambleAsync({
          functionName: "mintFoodNFT",
        });
        console.log("Food cooked successfully with direct call!");

        notification.success(`Minted Hamburger NFT! Event: minted hamburger`);
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
    writeFoodScrambleAsync,
    specialBoxMints,
    userTBA,
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

            // Wait for Envio to index the real blockchain event
            setTimeout(async () => {
              try {
                // Get real faucet usage data from Envio indexer
                // Faucet Used events not implemented—comment out logic for now
                // TODO: Implement faucet usage event tracking.
                // const latestFaucetUsage = faucetUsedEvents.find((f: any) => f.recipient === userAddress);
                // if (latestFaucetUsage) {
                //   notification.success(`Used Faucet! Received ${latestFaucetUsage.amount} MON tokens! (Real on-chain data from Envio)`);
                // } else {
                // Fallback notification if Envio not ready
                notification.success(`Used Faucet! Received MON tokens!`);
                // }
              } catch (error) {
                console.error("Error getting real faucet data:", error);
                notification.success(`Used Faucet! Received MON tokens!`);
              }
            }, 2000); // Wait 2 seconds for Envio indexing

            // NO local event emission - Envio indexer will catch real blockchain event
          }
        } else {
          // Use direct contract call
          console.log("Using direct contract call for faucet");
          await writeFoodScrambleAsync({
            functionName: "useFaucetMon",
            args: undefined,
          });
          console.log("Faucet used successfully with direct call!");

          notification.success(`🚰 Used Faucet! Received MON tokens!`);
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
    [tbaAddress, isSmartAccountDeployed, smartAccountAddress, gaslessHandleFaucetMon, writeFoodScrambleAsync],
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
