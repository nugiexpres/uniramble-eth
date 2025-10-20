"use client";

import { encodeFunctionData } from "viem";
import { GameControls } from "~~/app/board/_components/GameControls";
import { useDelegationExecution } from "~~/hooks/delegation/useGaslessExecution";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";

interface GameControlsWithDelegationProps {
  // All GameControls props
  handleRoll: () => void;
  handleBuy: () => void;
  handleRail: () => void;
  handleCook: () => void;
  handleFaucetMon: (isOnStove: boolean) => void;
  isOnStove: boolean;
  isOnRail?: boolean;
  faucetUsed: boolean;
  canBuy: boolean;
  isModalOpen: boolean;
  playerPosition: number;
  isRolling: boolean;
  isBuying: boolean;
  isRailTraveling?: boolean;
  isCooking?: boolean;
  isUsingFaucet?: boolean;
  buyError: string | null;
  ingredientFee: string;
  effectivePosition: number | null;
  tbaAddress: string | undefined;
  currentGrid?: string;
  isMobile?: boolean;
  gridData?: any[];
  isSmartAccountDeployed?: boolean;
  smartAccountAddress?: string;
  smartAccountTbaAddress?: string;
}

/**
 * GameControlsWithDelegation
 *
 * Wraps GameControls with delegation capabilities for session key transactions.
 *
 * Features:
 * - Enables delegation mode via DelegationCaveatEnforcer
 * - Automatically uses delegated execution when delegation is active
 * - Falls back to normal execution if delegation fails
 * - Shows delegation status in UI
 *
 * Usage:
 * Replace <GameControls /> with <GameControlsWithDelegation /> in your board component
 */
export const GameControlsWithDelegation = (props: GameControlsWithDelegationProps) => {
  const {
    handleRoll: originalHandleRoll,
    handleBuy: originalHandleBuy,
    handleRail: originalHandleRail,
    handleCook: originalHandleCook,
    handleFaucetMon: originalHandleFaucetMon,
    isOnStove,
    smartAccountAddress,
    ...restProps
  } = props;

  // Initialize delegation execution hook
  const { shouldUseDelegation, executeDelegatedTransaction } = useDelegationExecution(smartAccountAddress);
  const { targetNetwork } = useTargetNetwork();

  // Get all contracts for current network from Scaffold-ETH
  const contracts = useAllContracts();
  const foodScrambleContract = contracts.FoodScramble;

  if (!foodScrambleContract) {
    console.warn(`⚠️ FoodScramble contract not deployed on ${targetNetwork.name}`);
  }

  // Enhanced handlers - execute delegated transactions when delegation is active
  const handleRoll = async () => {
    const useDelegation = shouldUseDelegation();
    console.log("🎮 Roll action - Delegation mode:", useDelegation ? "ENABLED" : "DISABLED");

    if (useDelegation) {
      console.log("🎮 Delegated Roll - executing with session key (no signature needed)");

      try {
        if (!foodScrambleContract) {
          throw new Error("FoodScramble contract not found");
        }

        const data = encodeFunctionData({
          abi: foodScrambleContract.abi,
          functionName: "movePlayer",
          args: [],
        });

        const success = await executeDelegatedTransaction(foodScrambleContract.address, data);

        if (success) {
          console.log("✅ Delegated roll executed successfully");
          return;
        } else {
          console.warn("⚠️ Delegated roll failed, falling back to normal transaction");
        }
      } catch (error) {
        console.error("❌ Delegated roll error:", error);
        console.log("🔄 Falling back to normal transaction with wallet signature");
      }
    }

    // Normal mode: use original handler (requires wallet signature)
    console.log("🔐 Normal mode - calling original handler (wallet signature required)");
    originalHandleRoll();
  };

  const handleBuy = async () => {
    const useDelegation = shouldUseDelegation();
    console.log("🎮 Buy action - Delegation mode:", useDelegation ? "ENABLED" : "DISABLED");

    if (useDelegation) {
      console.log("🎮 Delegated Buy - executing with session key (no signature needed)");

      try {
        if (!foodScrambleContract) {
          throw new Error("FoodScramble contract not found");
        }

        const data = encodeFunctionData({
          abi: foodScrambleContract.abi,
          functionName: "buyIngredient",
          args: [],
        });

        const success = await executeDelegatedTransaction(foodScrambleContract.address, data);

        if (success) {
          console.log("✅ Delegated buy executed successfully");
          return;
        } else {
          console.warn("⚠️ Delegated buy failed, falling back to normal transaction");
        }
      } catch (error) {
        console.error("❌ Delegated buy error:", error);
        console.log("🔄 Falling back to normal transaction with wallet signature");
      }
    }

    // Normal mode: use original handler (requires wallet signature)
    console.log("🔐 Normal mode - calling original handler (wallet signature required)");
    originalHandleBuy();
  };

  const handleRail = async () => {
    const useDelegation = shouldUseDelegation();
    console.log("🎮 Rail action - Delegation mode:", useDelegation ? "ENABLED" : "DISABLED");

    if (useDelegation) {
      console.log("🎮 Delegated Rail - executing with session key (no signature needed)");

      try {
        if (!foodScrambleContract) {
          throw new Error("FoodScramble contract not found");
        }

        const data = encodeFunctionData({
          abi: foodScrambleContract.abi,
          functionName: "travelRail",
          args: [],
        });

        const success = await executeDelegatedTransaction(foodScrambleContract.address, data);

        if (success) {
          console.log("✅ Delegated rail executed successfully");
          return;
        } else {
          console.warn("⚠️ Delegated rail failed, falling back to normal transaction");
        }
      } catch (error) {
        console.error("❌ Delegated rail error:", error);
        console.log("🔄 Falling back to normal transaction with wallet signature");
      }
    }

    // Normal mode: use original handler (requires wallet signature)
    console.log("🔐 Normal mode - calling original handler (wallet signature required)");
    originalHandleRail();
  };

  const handleCook = async () => {
    const useDelegation = shouldUseDelegation();
    console.log("🎮 Cook action - Delegation mode:", useDelegation ? "ENABLED" : "DISABLED");

    if (useDelegation) {
      console.log("🎮 Delegated Cook - executing with session key (no signature needed)");

      try {
        if (!foodScrambleContract) {
          throw new Error("FoodScramble contract not found");
        }

        const data = encodeFunctionData({
          abi: foodScrambleContract.abi,
          functionName: "mintFoodNFT",
          args: [],
        });

        const success = await executeDelegatedTransaction(foodScrambleContract.address, data);

        if (success) {
          console.log("✅ Delegated cook executed successfully");
          return;
        } else {
          console.warn("⚠️ Delegated cook failed, falling back to normal transaction");
        }
      } catch (error) {
        console.error("❌ Delegated cook error:", error);
        console.log("🔄 Falling back to normal transaction with wallet signature");
      }
    }

    // Normal mode: use original handler (requires wallet signature)
    console.log("🔐 Normal mode - calling original handler (wallet signature required)");
    originalHandleCook();
  };

  const handleFaucetMon = async (isOnStoveParam: boolean) => {
    const useDelegation = shouldUseDelegation();
    console.log("🎮 Faucet action - Delegation mode:", useDelegation ? "ENABLED" : "DISABLED");

    if (useDelegation) {
      console.log("🎮 Delegated Faucet - executing with session key (no signature needed)");

      try {
        if (!foodScrambleContract) {
          throw new Error("FoodScramble contract not found");
        }

        const data = encodeFunctionData({
          abi: foodScrambleContract.abi,
          functionName: "useFaucetMon",
          args: [],
        });

        const success = await executeDelegatedTransaction(foodScrambleContract.address, data);

        if (success) {
          console.log("✅ Delegated faucet executed successfully");
          return;
        } else {
          console.warn("⚠️ Delegated faucet failed, falling back to normal transaction");
        }
      } catch (error) {
        console.error("❌ Delegated faucet error:", error);
        console.log("🔄 Falling back to normal transaction with wallet signature");
      }
    }

    // Normal mode: use original handler (requires wallet signature)
    console.log("🔐 Normal mode - calling original handler (wallet signature required)");
    originalHandleFaucetMon(isOnStoveParam);
  };

  // Return GameControls with enhanced handlers
  return (
    <GameControls
      {...restProps}
      isOnStove={isOnStove}
      handleRoll={handleRoll}
      handleBuy={handleBuy}
      handleRail={handleRail}
      handleCook={handleCook}
      handleFaucetMon={handleFaucetMon}
    />
  );
};
