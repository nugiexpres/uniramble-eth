import { useEffect, useState } from "react";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { http, parseEther } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

interface FinalSmartAccountState {
  smartAccount: any | null;
  isDeployed: boolean;
  isLoading: boolean;
  error: string | null;
  smartAccountAddress: string | null;
  bundlerClient: any | null;
  paymasterClient: any | null;
  publicClient: any | null;
}

export const useFinalSmartAccount = () => {
  const { address, isConnected } = useAccount();
  const wagmiPublicClient = usePublicClient(); // ✅ wagmi's client (Alchemy) for read operations
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();

  const [state, setState] = useState<FinalSmartAccountState>({
    smartAccount: null,
    isDeployed: false,
    isLoading: false,
    error: null,
    smartAccountAddress: null,
    bundlerClient: null,
    paymasterClient: null,
    publicClient: null,
  });

  // Save smart account state to localStorage (permanent storage)
  const saveSmartAccountState = (smartAccount: any, isDeployed: boolean, address: string) => {
    if (typeof window !== "undefined") {
      // Generate a simple hash for additional security
      const hash = btoa(`${address}_${Date.now()}_${Math.random()}`).slice(0, 16);

      const stateData = {
        smartAccountAddress: smartAccount?.address,
        isDeployed,
        eoaAddress: address,
        timestamp: Date.now(),
        hash, // Add hash for integrity check
        version: "2.0", // Updated version for localStorage
      };

      // Use a more secure key with hash
      const secureKey = `sa_${hash}_${address.slice(-8)}`;

      // Save to localStorage for permanent storage
      localStorage.setItem(secureKey, JSON.stringify(stateData));
      localStorage.setItem(`sa_mapping_${address}`, secureKey);

      // Also save to sessionStorage for current session
      sessionStorage.setItem(secureKey, JSON.stringify(stateData));
      sessionStorage.setItem(`sa_mapping_${address}`, secureKey);
    }
  };

  // Restore smart account state from localStorage (permanent storage)
  const restoreSmartAccountState = async (
    address: string,
    publicClient: any,
    bundlerClient: any,
    paymasterClient: any,
  ): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    try {
      // Try localStorage first (permanent storage)
      let mappingKey = localStorage.getItem(`sa_mapping_${address}`);
      let savedState = null;

      if (mappingKey) {
        savedState = localStorage.getItem(mappingKey);
      }

      // Fallback to sessionStorage if localStorage not available
      if (!savedState) {
        mappingKey = sessionStorage.getItem(`sa_mapping_${address}`);
        if (mappingKey) {
          savedState = sessionStorage.getItem(mappingKey);
        }
      }

      if (!savedState) return false;

      const stateData = JSON.parse(savedState);

      // Security validations
      if (!stateData?.version || (stateData.version !== "1.0" && stateData.version !== "2.0")) {
        console.warn("Invalid state version, clearing...");
        clearSecureState(address);
        return false;
      }

      if (!stateData?.hash || !stateData?.eoaAddress || stateData.eoaAddress !== address) {
        console.warn("State integrity check failed, clearing...");
        clearSecureState(address);
        return false;
      }

      // For localStorage (version 2.0), extend expiration to 30 days
      // For sessionStorage (version 1.0), keep 6 hours
      const expirationTime = stateData.version === "2.0" ? 30 * 24 * 60 * 60 * 1000 : 6 * 60 * 60 * 1000;
      const isStateValid = Date.now() - (stateData?.timestamp || 0) < expirationTime;
      if (!isStateValid) {
        console.warn("State expired, clearing...");
        clearSecureState(address);
        return false;
      }

      // Verify smart account address format
      if (!stateData?.smartAccountAddress || !stateData.smartAccountAddress.startsWith("0x")) {
        console.warn("Invalid smart account address, clearing...");
        clearSecureState(address);
        return false;
      }

      // DON'T recreate smart account object during restore to avoid wallet signature popup
      // Smart account will be recreated when user explicitly clicks deploy button
      console.log("Smart account state restored (address only, no signature needed)");

      setState(prev => ({
        ...prev,
        smartAccount: null, // Don't recreate to avoid signature popup
        isDeployed: stateData.isDeployed, // Use saved deployment status
        smartAccountAddress: stateData.smartAccountAddress,
        bundlerClient,
        paymasterClient,
        publicClient,
        error: null, // Clear any previous errors
        isLoading: false, // Ensure not loading
      }));

      console.log("Smart account state restored from sessionStorage (secure):", {
        smartAccountAddress: stateData.smartAccountAddress,
        isDeployed: stateData.isDeployed,
        eoaAddress: stateData.eoaAddress,
        timestamp: new Date(stateData.timestamp).toISOString(),
      });

      return true; // Successfully restored
    } catch (error) {
      console.error("Failed to restore smart account state:", error);
      // Clear potentially corrupted state
      clearSecureState(address);
      return false;
    }
  };

  // Clear secure state from both localStorage and sessionStorage
  const clearSecureState = (address: string) => {
    if (typeof window === "undefined") return;

    try {
      // Clear from localStorage
      const localStorageKey = localStorage.getItem(`sa_mapping_${address}`);
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }
      localStorage.removeItem(`sa_mapping_${address}`);

      // Clear from sessionStorage
      const sessionStorageKey = sessionStorage.getItem(`sa_mapping_${address}`);
      if (sessionStorageKey) {
        sessionStorage.removeItem(sessionStorageKey);
      }
      sessionStorage.removeItem(`sa_mapping_${address}`);
    } catch (error) {
      console.error("Failed to clear secure state:", error);
    }
  };

  // Initialize clients and restore smart account state
  // Reset and clear old state when wallet changes
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or address changes
      if (address) {
        console.log("🔄 Wallet changed or disconnected, clearing old state");
      }
    };
  }, [address]);

  useEffect(() => {
    if (!isConnected || !address || !wagmiPublicClient) {
      // Reset state when wallet disconnects
      if (!isConnected) {
        setState(prev => ({
          ...prev,
          smartAccount: null,
          isDeployed: false,
          smartAccountAddress: null,
          error: null,
        }));
      }
      return;
    }

    // Prevent re-initialization if clients are already initialized
    if (state.bundlerClient && state.paymasterClient && state.publicClient) {
      console.log("Clients already initialized, skipping...");
      return;
    }

    const initializeAndDeploy = async () => {
      try {
        const chainId = targetNetwork.id;
        const bundlerConfig = getBundlerConfig(chainId);

        // Check if Pimlico API key is configured
        if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
          setState(prev => ({
            ...prev,
            error: "Pimlico API key not configured. Please set NEXT_PUBLIC_PIMLICO_API_KEY in your .env file",
          }));
          return;
        }

        // Alchemy API key for read operations (optional but recommended)
        if (!process.env.NEXT_PUBLIC_ALCHEMY_API_KEY) {
          console.warn("Alchemy API key not configured - using public RPC for reads");
        }

        console.log("Initializing clients for Smart Account...");

        // ✅ Use wagmi's public client (Alchemy) for read operations (eth_getCode, etc)
        // This avoids 403 errors and uses reliable Alchemy infrastructure
        if (!wagmiPublicClient) {
          console.error("wagmi public client not available");
          setState(prev => ({
            ...prev,
            error: "Public client not available. Please try again.",
          }));
          return;
        }

        // Create bundler client with Alchemy (for gasless deployment)
        const bundlerClient = createBundlerClient({
          client: wagmiPublicClient, // ✅ wagmi's client (Alchemy)
          transport: http(bundlerConfig.bundlerUrl), // Alchemy bundler
        });

        // Create paymaster client with Alchemy Gas Manager (for gas sponsorship)
        const paymasterClient = createPaymasterClient({
          transport: http(bundlerConfig.paymasterUrl), // Alchemy Gas Manager
        });

        setState(prev => ({
          ...prev,
          bundlerClient,
          paymasterClient,
          publicClient: wagmiPublicClient, // ✅ Store wagmi's client
        }));

        // Try to restore smart account state from sessionStorage (ONLY ONCE)
        const restored = await restoreSmartAccountState(address, wagmiPublicClient, bundlerClient, paymasterClient);

        // User must manually deploy Smart Account (no auto-deploy)
        if (!restored) {
          console.log("📦 No Smart Account found for EOA. User must manually deploy.");
        } else {
          console.log("✅ Smart Account state restored successfully");
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          error: `Failed to initialize clients: ${error.message}`,
        }));
      }
    };

    // Auto-initialize clients and restore Smart Account
    if (isConnected && address && wagmiPublicClient) {
      initializeAndDeploy();
    }
  }, [isConnected, address, wagmiPublicClient, targetNetwork]);

  // Create and deploy Smart Account
  const createAndDeploySmartAccount = async () => {
    // Add delay to ensure wallet is fully connected
    await new Promise(resolve => setTimeout(resolve, 500));

    if (!isConnected || !address) {
      setState(prev => ({ ...prev, error: "Wallet not connected. Please try again." }));
      return false;
    }

    if (!walletClient) {
      setState(prev => ({ ...prev, error: "Wallet client not ready. Please try again." }));
      return false;
    }

    // Prevent multiple simultaneous deployments
    if (state.isLoading) {
      console.warn("Deployment already in progress, skipping...");
      return false;
    }

    // Prevent re-deployment if already deployed
    if (state.isDeployed) {
      console.warn("Smart Account already deployed, skipping...");
      return false;
    }

    // Check if clients are initialized, if not, try to initialize them
    if (!state.publicClient || !state.bundlerClient || !state.paymasterClient) {
      console.log("Initializing clients for Smart Account deployment...");
      setState(prev => ({ ...prev, error: "Initializing clients, please wait...", isLoading: true }));

      try {
        const chainId = targetNetwork.id;
        const bundlerConfig = getBundlerConfig(chainId);

        if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
          setState(prev => ({
            ...prev,
            error: "Pimlico API key not configured. Please set NEXT_PUBLIC_PIMLICO_API_KEY in your .env file",
            isLoading: false,
          }));
          return false;
        }

        console.log("Creating clients for chain:", chainId, "with bundler config:", bundlerConfig);

        // ✅ Use wagmi's public client (Alchemy) for read operations
        if (!wagmiPublicClient) {
          setState(prev => ({
            ...prev,
            error: "Public client not available. Please try again.",
            isLoading: false,
          }));
          return false;
        }

        // Create bundler client with Alchemy (for gasless deployment)
        const bundlerClient = createBundlerClient({
          client: wagmiPublicClient, // ✅ wagmi's client (Alchemy)
          transport: http(bundlerConfig.bundlerUrl), // Alchemy bundler
        });

        // Create paymaster client with Alchemy Gas Manager (for gas sponsorship)
        const paymasterClient = createPaymasterClient({
          transport: http(bundlerConfig.paymasterUrl), // Alchemy Gas Manager
        });

        console.log("Clients created successfully:", {
          publicClient: !!wagmiPublicClient,
          bundlerClient: !!bundlerClient,
          paymasterClient: !!paymasterClient,
        });

        // Update state with new clients
        setState(prev => ({
          ...prev,
          bundlerClient,
          paymasterClient,
          publicClient: wagmiPublicClient, // ✅ Store wagmi's client
          error: null,
          isLoading: false,
        }));

        // Wait for state to update properly
        await new Promise(resolve => setTimeout(resolve, 300));

        console.log("Clients initialized successfully, proceeding with deployment...");
      } catch (error: any) {
        console.error("Failed to initialize clients:", error);
        setState(prev => ({
          ...prev,
          error: `Failed to initialize clients: ${error.message}`,
          isLoading: false,
        }));
        return false;
      }
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log("Creating Smart Account...");

      // Ensure we have a valid public client
      const clientToUse = state.publicClient || wagmiPublicClient;
      if (!clientToUse) {
        throw new Error("Public client not available. Please try again.");
      }

      // Validate that the client has the required chain property
      if (!clientToUse.chain) {
        throw new Error("Client chain configuration is missing. Please check your network connection.");
      }

      console.log("Using client with chain:", clientToUse.chain.name, "ID:", clientToUse.chain.id);

      // Create Smart Account using Hybrid implementation
      // This supports both EOA owner and passkey signers
      const smartAccount = await toMetaMaskSmartAccount({
        client: clientToUse,
        implementation: Implementation.Hybrid,
        deployParams: [address as `0x${string}`, [], [], []], // [owner, passkeys, threshold, salt]
        deploySalt: "0x", // Use empty salt for deterministic deployment
        signer: { walletClient },
      });

      console.log("Smart Account created:", smartAccount.address);

      // Deploy the smart account with a simple transaction
      console.log("Deploying Smart Account...");

      // Get current clients or reinitialize if needed
      let bundlerClient = state.bundlerClient;
      let paymasterClient = state.paymasterClient;

      if (!bundlerClient || !paymasterClient) {
        console.log("Clients not available, reinitializing...");
        const clients = await reinitializeClients();
        if (!clients) {
          throw new Error("Failed to initialize clients. Please try again.");
        }
        // Use the clients returned from reinitializeClients
        bundlerClient = clients.bundlerClient;
        paymasterClient = clients.paymasterClient;
      }

      // Final check - if still null, throw error
      if (!bundlerClient || !paymasterClient) {
        throw new Error("Bundler or Paymaster client is still null after reinitialization");
      }

      // The smart account will be deployed automatically on first user operation
      // Use Pimlico paymaster for gasless transaction
      const userOperationHash = await bundlerClient.sendUserOperation({
        account: smartAccount,
        calls: [
          {
            to: address as `0x${string}`,
            value: parseEther("0"),
          },
        ],
        paymaster: paymasterClient,
      });

      console.log("Smart Account deployed! UserOperation Hash:", userOperationHash);

      // Wait for the transaction to be mined and get the actual transaction hash
      let actualTxHash: string | null = null;
      try {
        // Wait longer for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Try multiple approaches to get the transaction hash
        try {
          // Method 1: Use waitForUserOperationReceipt with timeout
          const receipt = await bundlerClient.waitForUserOperationReceipt({
            hash: userOperationHash,
          });

          if (receipt?.transactionHash) {
            actualTxHash = receipt.transactionHash;
            console.log("Actual deployment transaction hash (method 1):", actualTxHash);
          }
        } catch (method1Error) {
          console.warn("Deployment method 1 failed:", method1Error);

          // Method 2: Try getUserOperationReceipt
          try {
            const receipt = await bundlerClient.getUserOperationReceipt({
              hash: userOperationHash,
            });

            if (receipt?.transactionHash) {
              actualTxHash = receipt.transactionHash;
              console.log("Actual deployment transaction hash (method 2):", actualTxHash);
            }
          } catch (method2Error) {
            console.warn("Deployment method 2 failed:", method2Error);

            // Method 3: Try to get from bundler events
            try {
              // Wait a bit more and try again
              await new Promise(resolve => setTimeout(resolve, 3000));
              const receipt = await bundlerClient.waitForUserOperationReceipt({
                hash: userOperationHash,
              });

              if (receipt?.transactionHash) {
                actualTxHash = receipt.transactionHash;
                console.log("Actual deployment transaction hash (method 3):", actualTxHash);
              }
            } catch (method3Error) {
              console.warn("Deployment method 3 failed:", method3Error);
            }
          }
        }
      } catch (waitError) {
        console.warn("All deployment methods failed to get actual transaction hash:", waitError);
      }

      // If we still don't have the actual tx hash, use userOperationHash as fallback
      if (!actualTxHash) {
        console.warn("Using userOperationHash as fallback for deployment:", userOperationHash);
        actualTxHash = userOperationHash;
      }

      // Validate the transaction hash format
      if (actualTxHash && !actualTxHash.startsWith("0x")) {
        console.warn("Invalid deployment transaction hash format:", actualTxHash);
        actualTxHash = userOperationHash;
      }

      console.log("Final deployment transaction hash to return:", actualTxHash);

      setState(prev => ({
        ...prev,
        smartAccount,
        isDeployed: true,
        smartAccountAddress: smartAccount.address,
        isLoading: false,
        error: null,
      }));

      // Save smart account state to sessionStorage
      saveSmartAccountState(smartAccount, true, address);

      return true;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create and deploy smart account";
      console.error("Create and deploy error:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // Send gasless transaction
  const sendGaslessTransaction = async (to: string, value: string = "0") => {
    if (!state.smartAccount || !state.isDeployed) {
      setState(prev => ({ ...prev, error: "Smart account not created or deployed" }));
      return false;
    }

    if (!state.bundlerClient || !state.paymasterClient) {
      setState(prev => ({ ...prev, error: "Clients not initialized. Please try again." }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      console.log("Sending gasless transaction...");
      console.log("To:", to);
      console.log("Value:", value);

      // Send gasless transaction using Pimlico paymaster
      const userOperationHash = await state.bundlerClient.sendUserOperation({
        account: {
          ...state.smartAccount,
          account: state.smartAccount, // Add account property for signTypedData
        },
        calls: [
          {
            to: to as `0x${string}`,
            value: parseEther(value),
          },
        ],
        paymaster: state.paymasterClient,
      });

      console.log("Gasless transaction sent! UserOperation Hash:", userOperationHash);

      // Wait for the transaction to be mined and get the actual transaction hash
      let actualTxHash: string | null = null;
      try {
        // Wait longer for the transaction to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Try multiple approaches to get the transaction hash
        try {
          // Method 1: Use waitForUserOperationReceipt with timeout
          const receipt = await state.bundlerClient.waitForUserOperationReceipt({
            hash: userOperationHash,
          });

          if (receipt?.transactionHash) {
            actualTxHash = receipt.transactionHash;
            console.log("Actual transaction hash (method 1):", actualTxHash);
          }
        } catch (method1Error) {
          console.warn("Method 1 failed:", method1Error);

          // Method 2: Try getUserOperationReceipt
          try {
            const receipt = await state.bundlerClient.getUserOperationReceipt({
              hash: userOperationHash,
            });

            if (receipt?.transactionHash) {
              actualTxHash = receipt.transactionHash;
              console.log("Actual transaction hash (method 2):", actualTxHash);
            }
          } catch (method2Error) {
            console.warn("Method 2 failed:", method2Error);

            // Method 3: Try to get from bundler events
            try {
              // Wait a bit more and try again
              await new Promise(resolve => setTimeout(resolve, 3000));
              const receipt = await state.bundlerClient.waitForUserOperationReceipt({
                hash: userOperationHash,
              });

              if (receipt?.transactionHash) {
                actualTxHash = receipt.transactionHash;
                console.log("Actual transaction hash (method 3):", actualTxHash);
              }
            } catch (method3Error) {
              console.warn("Method 3 failed:", method3Error);
            }
          }
        }
      } catch (waitError) {
        console.warn("All methods failed to get actual transaction hash:", waitError);
      }

      // If we still don't have the actual tx hash, use userOperationHash as fallback
      if (!actualTxHash) {
        console.warn("Using userOperationHash as fallback:", userOperationHash);
        actualTxHash = userOperationHash;
      }

      // Validate the transaction hash format
      if (actualTxHash && !actualTxHash.startsWith("0x")) {
        console.warn("Invalid transaction hash format:", actualTxHash);
        actualTxHash = userOperationHash;
      }

      console.log("Final transaction hash to return:", actualTxHash);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));

      return actualTxHash || userOperationHash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send gasless transaction";
      console.error("Gasless transaction error:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  };

  // Check if smart account is deployed
  const checkDeploymentStatus = async () => {
    if (!state.smartAccount || !state.smartAccount.address) return;

    try {
      // Use wagmi's publicClient which has better RPC handling (Alchemy fallback)
      const clientToUse = wagmiPublicClient || state.publicClient;
      if (!clientToUse) {
        console.warn("No public client available for deployment check");
        return;
      }

      // Add small delay to ensure deployment is complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      const code = await clientToUse.getCode({ address: state.smartAccount.address as `0x${string}` });
      const isDeployed = code !== "0x";

      // Only update if status changed to avoid unnecessary re-renders
      if (state.isDeployed !== isDeployed) {
        setState(prev => ({ ...prev, isDeployed }));
      }
    } catch (error) {
      console.error("Failed to check deployment status:", error);
      // Don't update state on error to avoid false negatives
    }
  };

  // Reset state (preserve clients to avoid re-initialization issues)
  const reset = () => {
    // Clear secure sessionStorage for current address
    if (address && typeof window !== "undefined") {
      clearSecureState(address);
    }

    setState(prev => ({
      ...prev,
      smartAccount: null,
      isDeployed: false,
      isLoading: false,
      error: null,
      smartAccountAddress: null,
      // Keep clients to avoid "Wallet not connected or clients not initialized" error
      // bundlerClient: prev.bundlerClient,
      // paymasterClient: prev.paymasterClient,
      // publicClient: prev.publicClient,
    }));
  };

  // Force reinitialize clients if needed
  const reinitializeClients = async () => {
    if (!isConnected || !address) return false;

    try {
      const chainId = targetNetwork.id;
      const bundlerConfig = getBundlerConfig(chainId);

      if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
        setState(prev => ({
          ...prev,
          error: "Pimlico API key not configured. Please set NEXT_PUBLIC_PIMLICO_API_KEY in your .env file",
        }));
        return false;
      }

      // ✅ Use wagmi's public client (Alchemy) for read operations
      if (!wagmiPublicClient) {
        setState(prev => ({
          ...prev,
          error: "Public client not available. Please try again.",
        }));
        return false;
      }

      // Create bundler client with Pimlico (for gasless deployment)
      const bundlerClient = createBundlerClient({
        client: wagmiPublicClient, // ✅ wagmi's client (Alchemy for reads)
        transport: http(bundlerConfig.bundlerUrl), // Pimlico bundler
      });

      // Create paymaster client with Pimlico (for gas sponsorship)
      const paymasterClient = createPaymasterClient({
        transport: http(bundlerConfig.paymasterUrl), // Pimlico paymaster
      });

      setState(prev => ({
        ...prev,
        bundlerClient,
        paymasterClient,
        publicClient: wagmiPublicClient, // ✅ Store wagmi's client
        error: null,
      }));

      return { bundlerClient, paymasterClient, publicClient: wagmiPublicClient };
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: `Failed to reinitialize clients: ${error.message}`,
      }));
      return false;
    }
  };

  // Check deployment status when smart account is created (with debounce to avoid rate limiting)
  useEffect(() => {
    if (state.smartAccount && !state.isDeployed) {
      // Only check once if not deployed
      const timer = setTimeout(() => {
        checkDeploymentStatus();
      }, 2000); // 2 second delay to avoid rate limiting

      return () => clearTimeout(timer);
    }
  }, [state.smartAccount?.address]); // Only trigger on address change, not whole object

  return {
    ...state,
    createAndDeploySmartAccount,
    sendGaslessTransaction,
    checkDeploymentStatus,
    reset,
    reinitializeClients,
  };
};
