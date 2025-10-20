import { encodeAbiParameters, keccak256 } from "viem";
import { useAccount } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export const useCaveatEnforcer = () => {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  // Use BasicCaveatEnforcer contract as the main enforcer
  const { writeContractAsync: writeEnforcerAsync } = useScaffoldWriteContract({
    contractName: "BasicCaveatEnforcer",
  });

  // Get contract addresses from deployedContracts based on current network
  const enforcerAddress =
    deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.BasicCaveatEnforcer?.address;

  // Setup delegation with BasicCaveatEnforcer
  const setupHybridDelegation = async (delegationHash: string) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    if (!enforcerAddress) {
      notification.error(
        "BasicCaveatEnforcer address not found. Ensure deployments are synced to deployedContracts.ts",
      );
      return false;
    }

    try {
      // Set allowed function for delegation
      const hash = await writeEnforcerAsync({
        functionName: "setAllowedTarget",
        args: [delegationHash as `0x${string}`, enforcerAddress as `0x${string}`],
      });

      notification.success(`Delegation setup completed! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to setup delegation";
      notification.error(`Failed to setup delegation: ${errorMessage}`);
      return false;
    }
  };

  // Set spending limit for a delegation
  // Supports both BasicCaveatEnforcer (4 params) and FinancialCaveatEnforcer (5 params)
  const setSpendingLimit = async (
    delegationHash: string,
    tokenAddress: string,
    maxAmount: bigint,
    validUntil: number,
    periodLength?: number,
  ) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Using setSpendingLimit function
      const args =
        periodLength !== undefined
          ? [
              delegationHash as `0x${string}`,
              tokenAddress as `0x${string}`,
              maxAmount,
              BigInt(validUntil),
              BigInt(periodLength),
            ]
          : [delegationHash as `0x${string}`, tokenAddress as `0x${string}`, maxAmount, BigInt(validUntil)];

      const hash = await writeEnforcerAsync({
        functionName: "setSpendingLimit",
        args: args as any,
      });

      notification.success(`Spending limit set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set spending limit";
      notification.error(`Failed to set spending limit: ${errorMessage}`);
      return false;
    }
  };

  // Set game action limits for a delegation using BasicCaveatEnforcer
  const setGameActionLimits = async (
    delegationHash: string,
    maxRolls: number,
    maxBuys = 0,
    maxRails = 0,
    maxFaucets = 0,
    maxCooks = 0,
    validUntil: number,
  ) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Call setGameActionLimit with all game action parameters
      const hash = await writeEnforcerAsync({
        functionName: "setGameActionLimit",
        args: [
          delegationHash as `0x${string}`,
          BigInt(maxRolls),
          BigInt(maxBuys),
          BigInt(maxRails),
          BigInt(maxFaucets),
          BigInt(maxCooks),
          BigInt(validUntil),
        ],
      });

      notification.success(`Game action limits set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set game action limits";
      notification.error(`Failed to set game action limits: ${errorMessage}`);
      return false;
    }
  };

  // Set rate limit for a delegation using BasicCaveatEnforcer
  const setRateLimit = async (delegationHash: string, maxCallsPerHour: number) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Using setSpendingLimit function as a rate limit workaround
      const hash = await writeEnforcerAsync({
        functionName: "setSpendingLimit",
        args: [
          delegationHash as `0x${string}`,
          "0x0000000000000000000000000000000000000000" as `0x${string}`, // ETH token address
          BigInt(maxCallsPerHour),
          BigInt(Date.now() + 3600000), // 1 hour from now
        ],
      });

      notification.success(`Rate limit set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set rate limit";
      notification.error(`Failed to set rate limit: ${errorMessage}`);
      return false;
    }
  };

  // Set time limit for a delegation using BasicCaveatEnforcer
  const setTimeLimit = async (delegationHash: string, validUntil: number) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Using setTimeLimit function
      const hash = await writeEnforcerAsync({
        functionName: "setTimeLimit",
        args: [delegationHash as `0x${string}`, BigInt(validUntil)],
      });

      notification.success(`Time limit set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set time limit";
      notification.error(`Failed to set time limit: ${errorMessage}`);
      return false;
    }
  };

  // Set allowed target addresses for a delegation using BasicCaveatEnforcer
  const setAllowedTargetAddresses = async (delegationHash: string, targetAddresses: string[]) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Using setAllowedTarget for each address
      for (const target of targetAddresses) {
        await writeEnforcerAsync({
          functionName: "setAllowedTarget",
          args: [delegationHash as `0x${string}`, target as `0x${string}`],
        });
      }

      notification.success(`Allowed target addresses set!`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set allowed target addresses";
      notification.error(`Failed to set allowed target addresses: ${errorMessage}`);
      return false;
    }
  };

  // Set token whitelist for a delegation using BasicCaveatEnforcer
  const setTokenWhitelist = async (delegationHash: string, tokens: string[]) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Using setAllowedTarget for each token
      for (const token of tokens) {
        await writeEnforcerAsync({
          functionName: "setAllowedTarget",
          args: [delegationHash as `0x${string}`, token as `0x${string}`],
        });
      }

      notification.success(`Token whitelist set!`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set token whitelist";
      notification.error(`Failed to set token whitelist: ${errorMessage}`);
      return false;
    }
  };

  // Generate delegation hash
  const generateDelegationHash = (delegator: string, delegatee: string, scopeType: string, nonce: number): string => {
    return keccak256(
      encodeAbiParameters(
        [
          { name: "delegator", type: "address" },
          { name: "delegatee", type: "address" },
          { name: "scope", type: "string" },
          { name: "nonce", type: "uint256" },
        ],
        [delegator as `0x${string}`, delegatee as `0x${string}`, scopeType, BigInt(nonce)],
      ),
    );
  };

  // Revoke a delegation by disabling all functions
  const revokeDelegation = async (delegationHash: string) => {
    if (!isConnected || !address || !writeEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      // Disable all functions by setting time limit to current time
      const currentTime = Math.floor(Date.now() / 1000);
      const hash = await writeEnforcerAsync({
        functionName: "setTimeLimit",
        args: [delegationHash as `0x${string}`, BigInt(currentTime)],
      });

      notification.success(`Delegation revoked! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to revoke delegation";
      notification.error(`Failed to revoke delegation: ${errorMessage}`);
      return false;
    }
  };

  return {
    // Contract address
    enforcerAddress,
    contractAddress: enforcerAddress, // For backward compatibility

    // Setup functions
    setupHybridDelegation,

    // Game enforcer functions
    setGameActionLimits,
    setRateLimit,
    setAllowedTargetAddresses,

    // Financial enforcer functions
    setSpendingLimit,
    setTimeLimit,
    setTokenWhitelist,

    // Delegation management
    revokeDelegation,

    // Utility functions
    generateDelegationHash,
  };
};
