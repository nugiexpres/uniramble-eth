import { useCallback, useState } from "react";
import { encodeFunctionData } from "viem";
import deployedContracts from "~~/contracts/deployedContracts";
import { useDelegationManager } from "~~/hooks/Delegation/useDelegationManager";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface GaslessGameActionsState {
  isExecuting: boolean;
  error: string | null;
}

export const useGaslessGameActions = (smartAccountAddress?: string) => {
  const { targetNetwork } = useTargetNetwork();
  const { executeTransaction, isDelegationActive, sessionKeyPrivateKey } = useDelegationManager();

  const [state, setState] = useState<GaslessGameActionsState>({
    isExecuting: false,
    error: null,
  });

  // Get contract addresses
  const foodScrambleAddress =
    deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.address;

  // Execute roll (movePlayer) gasless
  const executeRollGasless = useCallback(async () => {
    if (!isDelegationActive || !sessionKeyPrivateKey || !smartAccountAddress) {
      notification.error("Delegation not active. Enable gasless mode first.");
      return false;
    }

    if (!foodScrambleAddress) {
      notification.error("FoodScramble contract not found");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: null }));

      // Encode movePlayer() function call
      const contractAbi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.abi;
      if (!contractAbi) {
        throw new Error("Contract ABI not found");
      }

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: "movePlayer",
        args: [],
      });

      // Execute via delegation (gasless)
      const txHash = await executeTransaction(
        foodScrambleAddress,
        "0", // No value sent
        data,
        sessionKeyPrivateKey,
        smartAccountAddress,
      );

      if (txHash) {
        notification.success("🎲 Rolled dice gasless!");
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error("Transaction failed");
    } catch (error: any) {
      console.error("Gasless roll error:", error);
      setState(prev => ({ ...prev, isExecuting: false, error: error.message }));
      notification.error(`Gasless roll failed: ${error.message}`);
      return false;
    }
  }, [
    isDelegationActive,
    sessionKeyPrivateKey,
    smartAccountAddress,
    foodScrambleAddress,
    executeTransaction,
    targetNetwork.id,
  ]);

  // Execute buy ingredient gasless
  const executeBuyGasless = useCallback(async () => {
    if (!isDelegationActive || !sessionKeyPrivateKey || !smartAccountAddress) {
      notification.error("Delegation not active. Enable gasless mode first.");
      return false;
    }

    if (!foodScrambleAddress) {
      notification.error("FoodScramble contract not found");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: null }));

      // Encode buyIngredient() function call
      const contractAbi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.abi;
      if (!contractAbi) {
        throw new Error("Contract ABI not found");
      }

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: "buyIngredient",
        args: [],
      });

      // Execute via delegation (gasless)
      const txHash = await executeTransaction(
        foodScrambleAddress,
        "0", // No value sent
        data,
        sessionKeyPrivateKey,
        smartAccountAddress,
      );

      if (txHash) {
        notification.success("🛒 Bought ingredient gasless!");
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error("Transaction failed");
    } catch (error: any) {
      console.error("Gasless buy error:", error);
      setState(prev => ({ ...prev, isExecuting: false, error: error.message }));
      notification.error(`Gasless buy failed: ${error.message}`);
      return false;
    }
  }, [
    isDelegationActive,
    sessionKeyPrivateKey,
    smartAccountAddress,
    foodScrambleAddress,
    executeTransaction,
    targetNetwork.id,
  ]);

  // Execute rail travel gasless
  const executeRailGasless = useCallback(async () => {
    if (!isDelegationActive || !sessionKeyPrivateKey || !smartAccountAddress) {
      notification.error("Delegation not active. Enable gasless mode first.");
      return false;
    }

    if (!foodScrambleAddress) {
      notification.error("FoodScramble contract not found");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: null }));

      // Encode travelRail() function call
      const contractAbi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.abi;
      if (!contractAbi) {
        throw new Error("Contract ABI not found");
      }

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: "travelRail",
        args: [],
      });

      // Execute via delegation (gasless)
      const txHash = await executeTransaction(
        foodScrambleAddress,
        "0", // No value sent
        data,
        sessionKeyPrivateKey,
        smartAccountAddress,
      );

      if (txHash) {
        notification.success("🚂 Traveled via rail gasless!");
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error("Transaction failed");
    } catch (error: any) {
      console.error("Gasless rail error:", error);
      setState(prev => ({ ...prev, isExecuting: false, error: error.message }));
      notification.error(`Gasless rail failed: ${error.message}`);
      return false;
    }
  }, [
    isDelegationActive,
    sessionKeyPrivateKey,
    smartAccountAddress,
    foodScrambleAddress,
    executeTransaction,
    targetNetwork.id,
  ]);

  // Execute faucet gasless
  const executeFaucetGasless = useCallback(async () => {
    if (!isDelegationActive || !sessionKeyPrivateKey || !smartAccountAddress) {
      notification.error("Delegation not active. Enable gasless mode first.");
      return false;
    }

    if (!foodScrambleAddress) {
      notification.error("FoodScramble contract not found");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: null }));

      // Encode useFaucetMon() function call (no parameters)
      const contractAbi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.abi;
      if (!contractAbi) {
        throw new Error("Contract ABI not found");
      }

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: "useFaucetMon",
        args: [],
      });

      // Execute via delegation (gasless)
      const txHash = await executeTransaction(
        foodScrambleAddress,
        "0", // No value sent
        data,
        sessionKeyPrivateKey,
        smartAccountAddress,
      );

      if (txHash) {
        notification.success("💧 Used faucet gasless!");
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error("Transaction failed");
    } catch (error: any) {
      console.error("Gasless faucet error:", error);
      setState(prev => ({ ...prev, isExecuting: false, error: error.message }));
      notification.error(`Gasless faucet failed: ${error.message}`);
      return false;
    }
  }, [
    isDelegationActive,
    sessionKeyPrivateKey,
    smartAccountAddress,
    foodScrambleAddress,
    executeTransaction,
    targetNetwork.id,
  ]);

  // Execute cook gasless
  const executeCookGasless = useCallback(async () => {
    if (!isDelegationActive || !sessionKeyPrivateKey || !smartAccountAddress) {
      notification.error("Delegation not active. Enable gasless mode first.");
      return false;
    }

    if (!foodScrambleAddress) {
      notification.error("FoodScramble contract not found");
      return false;
    }

    try {
      setState(prev => ({ ...prev, isExecuting: true, error: null }));

      // Encode mintFoodNFT() function call
      const contractAbi = deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.FoodScramble?.abi;
      if (!contractAbi) {
        throw new Error("Contract ABI not found");
      }

      const data = encodeFunctionData({
        abi: contractAbi,
        functionName: "mintFoodNFT",
        args: [],
      });

      // Execute via delegation (gasless)
      const txHash = await executeTransaction(
        foodScrambleAddress,
        "0", // No value sent
        data,
        sessionKeyPrivateKey,
        smartAccountAddress,
      );

      if (txHash) {
        notification.success("👨‍🍳 Cooked burger gasless!");
        setState(prev => ({ ...prev, isExecuting: false }));
        return true;
      }

      throw new Error("Transaction failed");
    } catch (error: any) {
      console.error("Gasless cook error:", error);
      setState(prev => ({ ...prev, isExecuting: false, error: error.message }));
      notification.error(`Gasless cook failed: ${error.message}`);
      return false;
    }
  }, [
    isDelegationActive,
    sessionKeyPrivateKey,
    smartAccountAddress,
    foodScrambleAddress,
    executeTransaction,
    targetNetwork.id,
  ]);

  return {
    ...state,
    isDelegationActive,
    canExecuteGasless: isDelegationActive && !!sessionKeyPrivateKey && !!smartAccountAddress,
    executeRollGasless,
    executeBuyGasless,
    executeRailGasless,
    executeFaucetGasless,
    executeCookGasless,
  };
};
