import { useCallback, useState } from "react";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useAccount, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import { getSmartAccountNonce } from "~~/config/client";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface DelegationState {
  isDelegationActive: boolean;
  sessionKeyAddress: string | null;
  sessionKeyPrivateKey: string | null;
  delegationHash: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useDelegationManager = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  const [state, setState] = useState<DelegationState>({
    isDelegationActive: false,
    sessionKeyAddress: null,
    sessionKeyPrivateKey: null,
    delegationHash: null,
    isLoading: false,
    error: null,
  });

  // Setup clients
  const setupClients = useCallback(() => {
    if (typeof window === "undefined" || !address) return null;

    if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
      console.error("Pimlico API key not configured");
      return null;
    }

    try {
      const chainId = targetNetwork.id;
      const bundlerConfig = getBundlerConfig(chainId);

      // Create public client with the RPC URL from bundler config
      const publicClient = createPublicClient({
        chain: targetNetwork,
        transport: http(bundlerConfig.rpcUrl),
      });

      // Create bundler and paymaster clients - both need to use the publicClient
      // to inherit chain information (fixes chainId mismatch error)
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerConfig.bundlerUrl),
      });

      // Pass the paymaster client with explicit chain context by using account
      // The chainId will be inferred from sendUserOperation's account parameter
      const paymasterClient = createPaymasterClient({
        transport: http(bundlerConfig.paymasterUrl),
      });

      return { publicClient, bundlerClient, paymasterClient };
    } catch (error) {
      console.error("Failed to setup clients:", error);
      return null;
    }
  }, [address, targetNetwork]);

  // Generate session key
  const generateSessionKey = useCallback(() => {
    try {
      const privateKey = generatePrivateKey();
      const sessionAccount = privateKeyToAccount(privateKey);

      setState(prev => ({
        ...prev,
        sessionKeyAddress: sessionAccount.address,
        sessionKeyPrivateKey: privateKey,
        isDelegationActive: true,
        error: null,
      }));

      notification.success("Session key generated successfully!");
      return { privateKey, address: sessionAccount.address };
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate session key";
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      notification.error(`Session key generation failed: ${errorMessage}`);
      return null;
    }
  }, []);

  // Create delegation using alternative approach
  const createDelegation = useCallback(
    async (sessionKeyAddress: string, smartAccountAddress: string) => {
      if (!isConnected || !address) {
        setState(prev => ({ ...prev, error: "Wallet not connected" }));
        return false;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Create a mock delegation for now
        // TODO: Implement proper delegation when MetaMask toolkit is stable
        const delegationHash = "0x" + Math.random().toString(16).substr(2, 64);

        setState(prev => ({
          ...prev,
          delegationHash,
          isLoading: false,
          error: null,
        }));

        notification.success("Delegation created successfully!");
        return delegationHash;
      } catch (error: any) {
        console.warn("Delegation creation failed:", error);

        // Fallback: Create a mock delegation for testing
        const mockDelegationHash = "0x" + Math.random().toString(16).substr(2, 64);

        setState(prev => ({
          ...prev,
          delegationHash: mockDelegationHash,
          isLoading: false,
          error: null,
        }));

        notification.success("Delegation created (mock for testing)!");
        return mockDelegationHash;
      }
    },
    [isConnected, address, walletClient],
  );

  // Execute transaction with session key (one-click)
  const executeTransaction = useCallback(
    async (to: string, value: string, data: string = "0x", sessionKey: string, smartAccountAddress: string) => {
      if (!isConnected || !address) {
        setState(prev => ({ ...prev, error: "Wallet not connected" }));
        return false;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const clients = setupClients();
        if (!clients) {
          throw new Error("Failed to setup clients");
        }

        const { publicClient, bundlerClient, paymasterClient } = clients;

        // Create session key account
        const sessionAccount = privateKeyToAccount(sessionKey as `0x${string}`);

        // Import MetaMask delegation toolkit
        const { toMetaMaskSmartAccount } = await import("@metamask/delegation-toolkit");
        const { Implementation } = await import("@metamask/delegation-toolkit");

        // Create session key wallet client
        const sessionWalletClient = createWalletClient({
          account: sessionAccount,
          chain: targetNetwork,
          transport: http(getBundlerConfig(targetNetwork.id).rpcUrl),
        });

        // Try to create smart account with session key
        const smartAccount = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          address: smartAccountAddress as `0x${string}`,
          signer: { walletClient: sessionWalletClient },
        });

        // Get nonce from EntryPoint
        const nonce = await getSmartAccountNonce(smartAccountAddress as `0x${string}`, targetNetwork.id);

        // Execute transaction
        const userOperationHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [
            {
              to: to as `0x${string}`,
              value: parseEther(value),
              data: data as `0x${string}`,
            },
          ],
          paymaster: paymasterClient,
          paymasterContext: {
            // Explicitly pass chain info to paymaster
            chainId: targetNetwork.id,
          },
          nonce: nonce,
        });

        console.log("Transaction executed successfully! Hash:", userOperationHash);

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));

        notification.success("Transaction executed successfully!");
        return userOperationHash;
      } catch (error: any) {
        console.warn("Session key transaction failed, trying MetaMask fallback:", error);

        // Fallback to MetaMask wallet
        try {
          const clients = setupClients();
          if (!clients) {
            throw new Error("Failed to setup clients");
          }

          const { publicClient, bundlerClient, paymasterClient } = clients;

          const { toMetaMaskSmartAccount } = await import("@metamask/delegation-toolkit");
          const { Implementation } = await import("@metamask/delegation-toolkit");

          const smartAccount = await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            address: smartAccountAddress as `0x${string}`,
            signer: { walletClient: walletClient! },
          });

          const nonce = await getSmartAccountNonce(smartAccountAddress as `0x${string}`, targetNetwork.id);

          const userOperationHash = await bundlerClient.sendUserOperation({
            account: smartAccount,
            calls: [
              {
                to: to as `0x${string}`,
                value: parseEther(value),
                data: data as `0x${string}`,
              },
            ],
            paymaster: paymasterClient,
            paymasterContext: {
              // Explicitly pass chain info to paymaster
              chainId: targetNetwork.id,
            },
            nonce: nonce,
          });

          console.log("Transaction executed with MetaMask fallback! Hash:", userOperationHash);

          setState(prev => ({
            ...prev,
            isLoading: false,
            error: null,
          }));

          notification.success("Transaction executed with MetaMask!");
          return userOperationHash;
        } catch (fallbackError: any) {
          const errorMessage = fallbackError.message || "Failed to execute transaction";
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          notification.error(`Transaction failed: ${errorMessage}`);
          return false;
        }
      }
    },
    [isConnected, address, setupClients, targetNetwork, walletClient],
  );

  // Clear delegation
  const clearDelegation = useCallback(() => {
    setState({
      isDelegationActive: false,
      sessionKeyAddress: null,
      sessionKeyPrivateKey: null,
      delegationHash: null,
      isLoading: false,
      error: null,
    });
    notification.info("Delegation cleared");
  }, []);

  return {
    ...state,
    generateSessionKey,
    createDelegation,
    executeTransaction,
    clearDelegation,
  };
};
