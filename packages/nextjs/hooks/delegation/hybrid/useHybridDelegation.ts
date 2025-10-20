import { useCallback, useState } from "react";
import { createCaveat } from "@metamask/delegation-toolkit";
import { useAccount } from "wagmi";
import { useCaveatEnforcer } from "~~/hooks/Delegation/useCaveatEnforcer";
// import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

// import deployedContracts from "~~/contracts/deployedContracts";

interface HybridDelegationState {
  isSetupComplete: boolean;
  delegationHash: string | null;
  isLoading: boolean;
  error: string | null;
}

interface GameActionConfig {
  maxRolls: number;
  maxBuys: number;
  maxRails: number;
  maxFaucets: number;
  maxCooks: number;
  validUntil: number;
  rateLimit: number;
}

interface FinancialConfig {
  spendingLimit: bigint;
  tokenAddress: string;
  validUntil: number;
  periodLength: number;
  allowedTokens: string[];
}

export const useHybridDelegation = () => {
  const { address, isConnected } = useAccount();
  // const { targetNetwork } = useTargetNetwork();
  const {
    enforcerAddress,
    setupHybridDelegation,
    setGameActionLimits,
    setRateLimit,
    setSpendingLimit,
    setTokenWhitelist,
    generateDelegationHash,
  } = useCaveatEnforcer();

  const [state, setState] = useState<HybridDelegationState>({
    isSetupComplete: false,
    delegationHash: null,
    isLoading: false,
    error: null,
  });

  // Create delegation with hybrid caveats
  const createHybridDelegation = useCallback(
    async (
      delegatee: string,
      gameConfig: GameActionConfig,
      financialConfig: FinancialConfig,
      scopeType: string = "gameActions",
    ) => {
      if (!isConnected || !address) {
        setState(prev => ({ ...prev, error: "Wallet not connected" }));
        return null;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Generate delegation hash
        const nonce = Date.now();
        const delegationHash = generateDelegationHash(address, delegatee, scopeType, nonce);

        // Setup hybrid delegation system
        const setupSuccess = await setupHybridDelegation(delegationHash);
        if (!setupSuccess) {
          throw new Error("Failed to setup hybrid delegation");
        }

        // Configure game action limits
        await setGameActionLimits(
          delegationHash,
          gameConfig.maxRolls,
          gameConfig.maxBuys,
          gameConfig.maxRails,
          gameConfig.maxFaucets,
          gameConfig.maxCooks,
          gameConfig.validUntil,
        );

        // Configure rate limit
        await setRateLimit(delegationHash, gameConfig.rateLimit);

        // Configure financial limits
        await setSpendingLimit(
          delegationHash,
          financialConfig.tokenAddress,
          financialConfig.spendingLimit,
          financialConfig.validUntil,
          financialConfig.periodLength,
        );

        // Configure token whitelist
        await setTokenWhitelist(delegationHash, financialConfig.allowedTokens);

        setState(prev => ({
          ...prev,
          isSetupComplete: true,
          delegationHash,
          isLoading: false,
          error: null,
        }));

        notification.success("Hybrid delegation created successfully!");
        return delegationHash;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to create hybrid delegation";
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        notification.error(`Failed to create hybrid delegation: ${errorMessage}`);
        return null;
      }
    },
    [
      isConnected,
      address,
      setupHybridDelegation,
      setGameActionLimits,
      setRateLimit,
      setSpendingLimit,
      setTokenWhitelist,
      generateDelegationHash,
    ],
  );

  // Create caveats for MetaMask delegation toolkit
  const createGameCaveats = useCallback(
    (delegationHash: string, gameActions: string[]) => {
      if (!enforcerAddress) {
        throw new Error("Enforcer address not available");
      }

      const caveats = gameActions.map(action => {
        const terms = encodeGameActionTerms(action);
        return createCaveat(
          enforcerAddress as `0x${string}`,
          terms,
          "0x", // No additional args needed
        );
      });

      return caveats;
    },
    [enforcerAddress],
  );

  // Create financial caveats
  const createFinancialCaveats = useCallback(
    (delegationHash: string, tokenAddress: string, maxAmount: bigint) => {
      if (!enforcerAddress) {
        throw new Error("Enforcer address not available");
      }

      const terms = encodeFinancialTerms(tokenAddress, maxAmount);
      return createCaveat(
        enforcerAddress as `0x${string}`,
        terms,
        "0x", // No additional args needed
      );
    },
    [enforcerAddress],
  );

  // Create default game configuration
  const getDefaultGameConfig = useCallback((): GameActionConfig => {
    return {
      maxRolls: 100,
      maxBuys: 100,
      maxRails: 100,
      maxFaucets: 100,
      maxCooks: 100,
      validUntil: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      rateLimit: 50, // 50 calls per hour
    };
  }, []);

  // Create default financial configuration
  const getDefaultFinancialConfig = useCallback((): FinancialConfig => {
    return {
      spendingLimit: BigInt("1000000000000000000"), // 1 ETH
      tokenAddress: "0x0000000000000000000000000000000000000000", // Native token
      validUntil: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
      periodLength: 86400, // 1 day in seconds
      allowedTokens: ["0x0000000000000000000000000000000000000000"], // Native token only
    };
  }, []);

  // Clear delegation state
  const clearDelegation = useCallback(() => {
    setState({
      isSetupComplete: false,
      delegationHash: null,
      isLoading: false,
      error: null,
    });
    notification.info("Delegation cleared");
  }, []);

  return {
    ...state,
    enforcerAddress,
    createHybridDelegation,
    createGameCaveats,
    createFinancialCaveats,
    getDefaultGameConfig,
    getDefaultFinancialConfig,
    clearDelegation,
  };
};

// Helper function to encode game action terms
function encodeGameActionTerms(action: string): `0x${string}` {
  const encoded = new TextEncoder().encode(JSON.stringify({ type: "gameActionLimit", action }));
  return `0x${Array.from(encoded)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}

// Helper function to encode financial terms
function encodeFinancialTerms(tokenAddress: string, maxAmount: bigint): `0x${string}` {
  const encoded = new TextEncoder().encode(
    JSON.stringify({
      type: "spendingLimit",
      token: tokenAddress,
      amount: maxAmount.toString(),
    }),
  );
  return `0x${Array.from(encoded)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;
}
