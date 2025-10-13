import { encodeAbiParameters, keccak256 } from "viem";
import { useAccount } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

export const useCaveatEnforcer = () => {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { writeContractAsync: writeCaveatEnforcerAsync } = useScaffoldWriteContract({
    contractName: "BasicCaveatEnforcer",
  });

  // Get contract address from deployedContracts based on current network
  const contractAddress =
    deployedContracts[targetNetwork.id as keyof typeof deployedContracts]?.BasicCaveatEnforcer?.address;

  // Set spending limit for a delegation
  const setSpendingLimit = async (
    delegationHash: string,
    tokenAddress: string,
    maxAmount: bigint,
    validUntil: number,
  ) => {
    if (!isConnected || !address || !writeCaveatEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      const hash = await writeCaveatEnforcerAsync({
        functionName: "setSpendingLimit",
        args: [delegationHash as `0x${string}`, tokenAddress as `0x${string}`, maxAmount, BigInt(validUntil)],
      });

      notification.success(`Spending limit set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set spending limit";
      notification.error(`Failed to set spending limit: ${errorMessage}`);
      return false;
    }
  };

  // Set allowed target for a delegation
  const setAllowedTarget = async (delegationHash: string, targetAddress: string) => {
    if (!isConnected || !address || !writeCaveatEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      const hash = await writeCaveatEnforcerAsync({
        functionName: "setAllowedTarget",
        args: [delegationHash as `0x${string}`, targetAddress as `0x${string}`],
      });

      notification.success(`Allowed target set! Hash: ${hash}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to set allowed target";
      notification.error(`Failed to set allowed target: ${errorMessage}`);
      return false;
    }
  };

  // Set time limit for a delegation
  const setTimeLimit = async (delegationHash: string, validUntil: number) => {
    if (!isConnected || !address || !writeCaveatEnforcerAsync) {
      notification.error("Wallet not connected or contract not available");
      return false;
    }

    try {
      const hash = await writeCaveatEnforcerAsync({
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

  return {
    contractAddress,
    setSpendingLimit,
    setAllowedTarget,
    setTimeLimit,
    generateDelegationHash,
  };
};
