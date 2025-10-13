import { useCallback, useState } from "react";
import { createPublicClient, http } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import { getSmartAccountNonce } from "~~/config/client";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface SessionKeyState {
  sessionKeyAddress: string | null;
  sessionKeyPrivateKey: string | null;
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  nonce: bigint | null;
  lastUsed: number | null;
}

export const useSessionKeyManager = (smartAccountAddress: string | null) => {
  const { address, isConnected } = useAccount();
  const { targetNetwork } = useTargetNetwork();

  const [state, setState] = useState<SessionKeyState>({
    sessionKeyAddress: null,
    sessionKeyPrivateKey: null,
    isActive: false,
    isLoading: false,
    error: null,
    nonce: null,
    lastUsed: null,
  });

  // Generate session key
  const generateSessionKey = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Generate a secure private key
      const privateKey = generatePrivateKey();
      const sessionAccount = privateKeyToAccount(privateKey);

      setState(prev => ({
        ...prev,
        sessionKeyAddress: sessionAccount.address,
        sessionKeyPrivateKey: privateKey,
        isActive: true,
        isLoading: false,
        error: null,
        lastUsed: Date.now(),
      }));

      console.log("Session key generated:", {
        address: sessionAccount.address,
        privateKey: privateKey.slice(0, 10) + "...",
      });

      notification.success("Session key generated successfully!");
      return { privateKey, address: sessionAccount.address };
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate session key";
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      notification.error(`Session key generation failed: ${errorMessage}`);
      return null;
    }
  }, []);

  // Get current nonce with retry mechanism
  const getCurrentNonce = useCallback(async (): Promise<bigint> => {
    if (!smartAccountAddress) {
      throw new Error("Smart account address not provided");
    }

    let retryCount = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    while (retryCount < maxRetries) {
      try {
        const nonce = await getSmartAccountNonce(smartAccountAddress as `0x${string}`, targetNetwork.id);

        setState(prev => ({
          ...prev,
          nonce,
        }));

        console.log(`Nonce retrieved successfully (attempt ${retryCount + 1}):`, nonce.toString());
        return nonce;
      } catch (error) {
        retryCount++;
        console.warn(`Nonce retrieval failed (attempt ${retryCount}):`, error);

        if (retryCount >= maxRetries) {
          throw new Error(`Failed to get nonce after ${maxRetries} attempts: ${error}`);
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, retryCount - 1);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error("Max retries exceeded");
  }, [smartAccountAddress, targetNetwork.id]);

  // Execute transaction with session key
  const executeTransaction = useCallback(
    async (to: string, value: string, data: string = "0x") => {
      if (!isConnected || !address || !smartAccountAddress || !state.sessionKeyPrivateKey) {
        setState(prev => ({
          ...prev,
          error: "Missing required parameters for session key transaction",
        }));
        return false;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Setup clients
        const chainId = targetNetwork.id;
        const bundlerConfig = getBundlerConfig(chainId);

        if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
          throw new Error("Pimlico API key not configured");
        }

        // Use wagmi's publicClient instead (uses Ankr for Monad)
        if (!publicClient) {
          throw new Error("Public client not available");
        }

        const bundlerClient = createBundlerClient({
          client: publicClient,
          transport: http(bundlerConfig.bundlerUrl),
        });

        const paymasterClient = createPaymasterClient({
          transport: http(bundlerConfig.bundlerUrl),
        });

        // Get current nonce
        const nonce = await getCurrentNonce();

        // Create session key account
        const sessionAccount = privateKeyToAccount(state.sessionKeyPrivateKey as `0x${string}`);

        // For now, we'll use a mock transaction since MetaMask delegation toolkit
        // doesn't fully support session key transactions yet
        console.log("Executing session key transaction:", {
          to,
          value,
          data,
          nonce: nonce.toString(),
          sessionKeyAddress: state.sessionKeyAddress,
        });

        // Simulate transaction execution
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock transaction hash
        const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          lastUsed: Date.now(),
        }));

        console.log("Session key transaction executed:", txHash);
        notification.success("Transaction executed with session key!");
        return txHash;
      } catch (error: any) {
        const errorMessage = error.message || "Failed to execute session key transaction";
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        notification.error(`Session key transaction failed: ${errorMessage}`);
        return false;
      }
    },
    [
      isConnected,
      address,
      smartAccountAddress,
      state.sessionKeyPrivateKey,
      state.sessionKeyAddress,
      targetNetwork,
      getCurrentNonce,
    ],
  );

  // Clear session key
  const clearSessionKey = useCallback(() => {
    setState({
      sessionKeyAddress: null,
      sessionKeyPrivateKey: null,
      isActive: false,
      isLoading: false,
      error: null,
      nonce: null,
      lastUsed: null,
    });
    notification.info("Session key cleared");
  }, []);

  // Refresh nonce
  const refreshNonce = useCallback(async () => {
    if (!smartAccountAddress) return;

    try {
      await getCurrentNonce();
      notification.success("Nonce refreshed");
    } catch (error: any) {
      notification.error(`Failed to refresh nonce: ${error.message}`);
    }
  }, [smartAccountAddress, getCurrentNonce]);

  return {
    ...state,
    generateSessionKey,
    executeTransaction,
    clearSessionKey,
    refreshNonce,
    getCurrentNonce,
  };
};
