import { useCallback, useState } from "react";
import { useSmartAccountTBA } from "../envio/useSmartAccountTBA";
import { useFoodScrambleData } from "./useFoodScrambleData";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { encodeFunctionData, http } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { notification } from "~~/utils/scaffold-eth";

interface GaslessGameActionsState {
  isRolling: boolean;
  isBuying: boolean;
  isRailTraveling: boolean;
  isCooking: boolean;
  isUsingFaucet: boolean;
  error: string | null;
  rollTxHash: string | null;
  buyTxHash: string | null;
  railTxHash: string | null;
  cookTxHash: string | null;
  faucetTxHash: string | null;
}

// Get contract ABI from deployedContracts
const getContractABI = (chainId: number, contractName: string) => {
  const contracts = deployedContracts as Record<number, any>;
  return contracts[chainId]?.[contractName]?.abi || [];
};

export const useGaslessGameActions = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient(); // Use wagmi's public client (configured with Alchemy)

  // Get smart account state
  const { smartAccountAddress, isDeployed: isSmartAccountDeployed } = useFinalSmartAccount();

  // Get Smart Account TBA data for verification
  const { refetchContractTBA } = useSmartAccountTBA();

  // Get TBA data from FoodScramble contract with Smart Account TBA integration
  // TBA is registered with Smart Account address when created gaslessly
  const {
    userTBA,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
    // Envio data for faster access
    envio: {
      playerPosition: envioPlayerPosition,
      positions: envioPositions,
      latestPositions,
      ingredientPurchases,
      specialBoxMints,
      loading: envioLoading,
    },
    // Smart Account TBA info
    smartAccount: { tbaAddress: smartAccountTbaAddress, usingSmartAccountTBA },
  } = useFoodScrambleData({
    address: smartAccountAddress as `0x${string}`,
    enableWatch: true,
  });
  // Debug logging for TBA reading
  console.log("useGaslessGameActions Debug:", {
    eoaAddress: address, // EOA address
    smartAccountAddress,
    userTBA,
    smartAccountTbaAddress,
    tbaExists: userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    isSmartAccountDeployed,
    willUseGasless: isSmartAccountDeployed && smartAccountAddress,
    envioData: { ingredientPurchases: ingredientPurchases.length, specialBoxMints: specialBoxMints.length },
  });

  // Get contract addresses and ABI from deployedContract
  const contracts = deployedContracts as Record<number, any>;
  const foodScrambleAddress = contracts[targetNetwork.id]?.FoodScramble?.address;
  const foodScrambleAbi = getContractABI(targetNetwork.id, "FoodScramble");

  const [state, setState] = useState<GaslessGameActionsState>({
    isRolling: false,
    isBuying: false,
    isRailTraveling: false,
    isCooking: false,
    isUsingFaucet: false,
    error: null,
    rollTxHash: null,
    buyTxHash: null,
    railTxHash: null,
    cookTxHash: null,
    faucetTxHash: null,
  });

  // Setup clients for gasless operations
  // NOTE: For read operations, use wagmi's publicClient (Alchemy)
  // Pimlico bundler/paymaster for gasless transactions
  const setupClients = useCallback(() => {
    console.log("🔧 setupClients called with:", {
      windowDefined: typeof window !== "undefined",
      address,
      isSmartAccountDeployed,
      hasWalletClient: !!walletClient,
      hasPublicClient: !!publicClient,
    });

    if (typeof window === "undefined" || !address || !isSmartAccountDeployed) {
      console.warn("setupClients: Window undefined or missing address/smart account");
      return null;
    }

    if (!walletClient) {
      console.error("setupClients: Wallet client not available");
      setState(prev => ({ ...prev, error: "Wallet client not available in setupClients" }));
      return null;
    }

    if (!publicClient) {
      console.error("setupClients: Public client not available");
      setState(prev => ({ ...prev, error: "Public client not available in setupClients" }));
      return null;
    }

    if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
      console.error("Pimlico API key not configured");
      setState(prev => ({ ...prev, error: "Pimlico API key not configured" }));
      return null;
    }

    // Check other required environment variables
    const requiredEnvVars = {
      PIMLICO_API_KEY: process.env.NEXT_PUBLIC_PIMLICO_API_KEY,
      ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
    };

    console.log("Environment variables check:", requiredEnvVars);

    if (!requiredEnvVars.ALCHEMY_API_KEY) {
      console.warn("Alchemy API key not configured - using public RPC for reads");
    }

    try {
      const chainId = targetNetwork.id;
      console.log("Setting up clients for chainId:", chainId);

      const bundlerConfig = getBundlerConfig(chainId);
      console.log("Bundler config:", bundlerConfig);

      // Validate bundler config
      if (!bundlerConfig.bundlerUrl) {
        throw new Error(`Invalid bundler config for chainId ${chainId}`);
      }

      // Use wagmi's public client for read operations (Alchemy RPC)
      // This provides reliable read operations
      console.log("Using wagmi's public client for read operations (Alchemy)");

      console.log("Creating Pimlico bundler client...");
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerConfig.bundlerUrl),
      });

      console.log("Creating Pimlico paymaster client...");
      const paymasterUrl = bundlerConfig.paymasterUrl || bundlerConfig.bundlerUrl;
      console.log("Paymaster URL:", paymasterUrl);
      const paymasterClient = createPaymasterClient({
        transport: http(paymasterUrl),
      });

      console.log("✅ Clients setup successfully");
      return { publicClient, bundlerClient, paymasterClient };
    } catch (error) {
      console.error("Failed to setup clients:", error);
      setState(prev => ({ ...prev, error: "Failed to setup clients - check configuration" }));
      return null;
    }
  }, [address, isSmartAccountDeployed, targetNetwork, walletClient, publicClient]);

  // Generic gasless transaction function
  const executeGaslessTransaction = useCallback(
    async (functionName: string, args: any[] = [], value: bigint = 0n) => {
      console.log(`🚀 Starting executeGaslessTransaction for ${functionName}:`, {
        isConnected,
        address,
        smartAccountAddress,
        isSmartAccountDeployed,
        hasWalletClient: !!walletClient,
        targetNetwork: targetNetwork.id,
        chainName: targetNetwork.name,
      });

      // CRITICAL: Check TBA registration for cook function
      if (functionName === "mintFoodNFT") {
        console.log("🍔 CRITICAL: Checking TBA registration for cook...");
        console.log("TBA registration check:", {
          msgSender: smartAccountAddress, // This is what contract will see
          userTBA: userTBA,
          smartAccountTbaAddress: smartAccountTbaAddress,
          functionName: "mintFoodNFT",
          contractLogic: "tbaList[msg.sender] where msg.sender = SmartAccount",
        });

        // Try multiple TBA sources
        const availableTBA = userTBA || smartAccountTbaAddress;

        if (!availableTBA || availableTBA === "0x0000000000000000000000000000000000000000") {
          console.error("❌ CRITICAL: No TBA address available for cook!");
          console.error("TBA sources checked:", {
            userTBA,
            smartAccountTbaAddress,
            smartAccountAddress,
          });
          setState(prev => ({ ...prev, error: "TBA not registered - please create TBA first" }));
          return false;
        }

        console.log("✅ TBA available for cook:", availableTBA);
      }

      if (!isConnected || !address || !smartAccountAddress || !isSmartAccountDeployed) {
        console.error("❌ Smart account prerequisites failed:", {
          isConnected,
          hasAddress: !!address,
          hasSmartAccountAddress: !!smartAccountAddress,
          isSmartAccountDeployed,
        });
        setState(prev => ({ ...prev, error: "Smart account not available - check connection and deployment" }));
        return false;
      }

      if (!walletClient) {
        console.error("❌ Wallet client not available");
        console.error("Wallet client details:", {
          walletClient: !!walletClient,
          isConnected,
          address,
          chainId: targetNetwork.id,
        });
        setState(prev => ({ ...prev, error: "Wallet client not available - check wallet connection" }));
        return false;
      }

      console.log("✅ Wallet client available:", {
        walletClient: !!walletClient,
        walletClientAccount: walletClient.account?.address,
        walletClientChain: walletClient.chain?.id,
      });

      try {
        console.log(`📝 Starting gasless transaction for ${functionName} with args:`, args);

        console.log("🔧 Step 1: Setting up clients...");
        const clients = setupClients();
        if (!clients) {
          console.error("❌ Failed to setup clients - check Pimlico configuration");
          throw new Error("Failed to setup clients - check Pimlico configuration");
        }

        const { publicClient, bundlerClient, paymasterClient } = clients;
        console.log("✅ Step 1 completed: Clients obtained successfully");

        // Create MetaMask Smart Account instance using Hybrid implementation
        console.log("🔧 Step 2: Creating smart account instance...");
        console.log("Smart account instance params:", {
          client: !!publicClient,
          implementation: Implementation.Hybrid,
          address: smartAccountAddress,
          walletClient: !!walletClient,
          walletClientAccount: walletClient.account?.address,
          walletClientChain: walletClient.chain?.id,
        });

        const smartAccountInstance = await toMetaMaskSmartAccount({
          client: publicClient,
          implementation: Implementation.Hybrid,
          address: smartAccountAddress as `0x${string}`,
          signer: { walletClient: walletClient },
        });
        console.log("✅ Step 2 completed: Smart account instance created:", {
          smartAccountAddress: smartAccountInstance.address,
        });

        // Get current nonce using MetaMask Smart Account's getNonce method
        console.log("🔧 Step 3: Getting nonce...");

        // Small retry helper for transient RPC issues
        const retryAsync = async <T>(fn: () => Promise<T>, attempts = 3, delayMs = 400) => {
          let lastError: any = null;
          for (let i = 0; i < attempts; i++) {
            try {
              return await fn();
            } catch (err) {
              lastError = err;
              console.warn(`Retry attempt ${i + 1} failed:`, err);
              if (i < attempts - 1) await new Promise(res => setTimeout(res, delayMs));
            }
          }
          throw lastError;
        };

        let nonce;
        try {
          nonce = await retryAsync(() => smartAccountInstance.getNonce(), 3, 300);
          console.log(`✅ Step 3 completed: Smart Account nonce for ${functionName}:`, nonce);
        } catch (nonceError) {
          console.error("❌ Failed to read Smart Account nonce after retries:", nonceError);
          setState(prev => ({ ...prev, error: "Failed to read Smart Account nonce (network error)" }));
          return false;
        }

        // Encode function call for FoodScramble contract
        console.log("🔧 Step 4: Encoding function call...");

        // CRITICAL: For cook function, verify TBA is registered in contract
        if (functionName === "mintFoodNFT") {
          console.log("🍔 CRITICAL: Verifying TBA registration in contract...");
          try {
            const tbaFromContract = await publicClient.readContract({
              address: foodScrambleAddress as `0x${string}`,
              abi: foodScrambleAbi,
              functionName: "tbaList",
              args: [smartAccountAddress as `0x${string}`],
            });

            console.log("TBA from contract check:", {
              smartAccountAddress,
              tbaFromContract,
              userTBA,
              match: tbaFromContract === userTBA,
            });

            if (!tbaFromContract || tbaFromContract === "0x0000000000000000000000000000000000000000") {
              console.error("❌ CRITICAL: TBA not registered in contract!");
              setState(prev => ({ ...prev, error: "TBA not registered in contract - please create TBA first" }));
              return false;
            }

            if (tbaFromContract !== userTBA) {
              console.error("❌ CRITICAL: TBA mismatch between contract and local state!");
              setState(prev => ({ ...prev, error: "TBA mismatch - please refresh page" }));
              return false;
            }

            console.log("✅ TBA registration verified in contract");
          } catch (tbaCheckError) {
            console.error("❌ Failed to verify TBA registration:", tbaCheckError);
            setState(prev => ({ ...prev, error: "Failed to verify TBA registration" }));
            return false;
          }
        }

        // CRITICAL: Check Smart Account balance before transaction
        console.log("💰 CRITICAL: Checking Smart Account balance...");
        try {
          const smartAccountBalance = await publicClient.getBalance({
            address: smartAccountAddress as `0x${string}`,
          });

          console.log("Smart Account balance check:", {
            smartAccountAddress,
            balance: smartAccountBalance.toString(),
            balanceETH: `${(Number(smartAccountBalance) / 1e18).toFixed(6)} ${targetNetwork.nativeCurrency.symbol}`,
            minRequired: `0.001 ${targetNetwork.nativeCurrency.symbol} (minimum for gas)`,
          });

          if (smartAccountBalance < 1000000000000000n) {
            // 0.001 native token minimum
            console.warn("⚠️ Smart Account balance is low:", {
              balance: smartAccountBalance.toString(),
              balanceETH: `${(Number(smartAccountBalance) / 1e18).toFixed(6)} ${targetNetwork.nativeCurrency.symbol}`,
              recommendation: "Fund Smart Account or use faucet",
            });
          }
        } catch (balanceError) {
          console.error("❌ Failed to check Smart Account balance:", balanceError);
        }

        const callData = encodeFunctionData({
          abi: foodScrambleAbi,
          functionName: functionName,
          args: args,
        });
        console.log("✅ Step 4 completed: Call data encoded:", callData);

        if (!foodScrambleAddress) {
          console.error("❌ FoodScramble contract address not found");
          throw new Error("FoodScramble contract address not found");
        }

        // Prepare user operation with proper nonce handling
        console.log("🔧 Step 5: Preparing user operation...");
        console.log("User operation params:", {
          account: smartAccountInstance.address,
          calls: [
            {
              to: foodScrambleAddress as `0x${string}`,
              value: value,
              data: callData,
            },
          ],
          paymaster: paymasterClient,
        });
        // Prepare the user operation via bundler client
        const userOperation = await bundlerClient.prepareUserOperation({
          account: smartAccountInstance,
          calls: [
            {
              to: foodScrambleAddress as `0x${string}`,
              value: value,
              data: callData,
            },
          ],
          paymaster: paymasterClient,
        });
        console.log("✅ Step 5 completed: User operation prepared:", userOperation);

        // Update nonce in user operation
        const userOperationWithNonce = {
          ...userOperation,
          nonce: nonce,
        };

        // Sign the user operation
        console.log("🔧 Step 6: Signing user operation...");
        console.log("About to trigger wallet popup for signing...");
        console.log("User operation to sign:", {
          sender: userOperationWithNonce.sender,
          nonce: userOperationWithNonce.nonce,
          callData: userOperationWithNonce.callData.slice(0, 20) + "...",
          callGasLimit: userOperationWithNonce.callGasLimit,
          verificationGasLimit: userOperationWithNonce.verificationGasLimit,
        });

        const signature = await smartAccountInstance.signUserOperation(userOperationWithNonce);
        console.log("✅ Step 6 completed: Signature obtained:", signature.slice(0, 10) + "...");

        // Send the user operation
        console.log("🔧 Step 7: Sending user operation...");
        const userOperationHash = await bundlerClient.sendUserOperation({
          ...userOperationWithNonce,
          signature: signature,
        });

        console.log(`🎉 ${functionName} gasless successful! UserOperation Hash:`, userOperationHash);
        return userOperationHash;
      } catch (error: any) {
        console.error(`${functionName} gasless failed:`, error);

        // Set user-friendly error message with detailed debugging
        let errorMessage = "Transaction failed";
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
        });

        if (error.message?.includes("Pimlico") || error.message?.includes("pimlico")) {
          errorMessage = "Pimlico configuration error - check API key";
        } else if (error.message?.includes("bundler")) {
          errorMessage = "Bundler connection failed - check network";
        } else if (error.message?.includes("nonce")) {
          errorMessage = "Nonce error - please try again";
        } else if (error.message?.includes("Insufficient payment") || error.message?.includes("insufficient")) {
          errorMessage = `Insufficient payment - Smart Account needs funding. Use faucet or send ${targetNetwork.nativeCurrency.symbol} to Smart Account`;
        } else if (error.message?.includes("prepareUserOperation")) {
          errorMessage = "Failed to prepare user operation - check Smart Account setup and funding";
        } else if (error.message?.includes("signUserOperation")) {
          errorMessage = "Failed to sign transaction - check wallet connection and approve transaction";
        } else if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
          errorMessage = "Transaction rejected by user - please approve in wallet";
        } else if (error.message?.includes("sendUserOperation")) {
          errorMessage = "Failed to send transaction - check bundler connection";
        } else if (error.message?.includes("UserOperationExecutionError")) {
          errorMessage = "Transaction execution failed - check Smart Account funding and TBA registration";
        } else if (error.message) {
          errorMessage = error.message;
        }

        setState(prev => ({ ...prev, error: errorMessage }));
        return false;
      }
    },
    [
      isConnected,
      address,
      smartAccountAddress,
      isSmartAccountDeployed,
      walletClient,
      setupClients,
      foodScrambleAddress,
      foodScrambleAbi,
      targetNetwork,
      userTBA,
      smartAccountTbaAddress,
    ],
  );

  // Roll dice action
  const handleRoll = useCallback(async () => {
    // Check TBA existence
    if (!userTBA || userTBA === "0x0000000000000000000000000000000000000000") {
      const errorMsg = "TBA not found. Please create TBA first.";
      setState(prev => ({ ...prev, error: errorMsg }));
      notification.error(`🎲 Roll Failed: ${errorMsg}`);
      return false;
    }

    try {
      setState(prev => ({ ...prev, isRolling: true, error: null }));
      notification.info("🎲 Rolling dice...");

      console.log("🎲 Roll Debug - Before Transaction:", {
        smartAccountAddress,
        userTBA,
        tbaSource: "from hook state",
      });

      const txHash = await executeGaslessTransaction("movePlayer", []);

      if (txHash) {
        setState(prev => ({
          ...prev,
          isRolling: false,
          rollTxHash: txHash,
          error: null,
        }));
        notification.success("🎲 Dice rolled successfully!");

        // Immediate refetch for instant position update
        if (refetchPlayerPosition && refetchRandomRoll && refetchCanBuy) {
          console.log("🔄 Immediate refetch after successful roll...");
          try {
            await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
            console.log("✅ Immediate refetch completed");
          } catch (refetchError) {
            console.warn("⚠️ Immediate refetch failed:", refetchError);
          }
        }

        return txHash;
      } else {
        throw new Error("🎲 Roll dice failed - No transaction hash returned. Please try again.");
      }
    } catch (error: any) {
      const errorMessage = error.message || "🎲 Roll dice failed. Please try again.";

      // Enhanced error logging for TBA issues
      if (errorMessage.includes("TBA not found") || errorMessage.includes("tbaList")) {
        console.error("🚨 TBA Mapping Issue:", {
          userTBA,
          errorMessage,
          hint: "Smart Account may not be mapped to TBA in contract. Check tbaList[SmartAccount]",
        });
        notification.error("🎲 TBA not mapped! Please wait for TBA creation to complete or refresh.");
      } else {
        notification.error(`🎲 Roll Failed: ${errorMessage}`);
      }

      setState(prev => ({
        ...prev,
        isRolling: false,
        error: errorMessage,
      }));
      return false;
    } finally {
      // Ensure loading state is always reset
      setState(prev => ({ ...prev, isRolling: false }));
    }
  }, [
    userTBA,
    executeGaslessTransaction,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
    smartAccountAddress,
  ]);

  // Buy ingredient action
  const handleBuy = useCallback(async () => {
    if (!userTBA || userTBA === "0x0000000000000000000000000000000000000000") {
      const errorMsg = "TBA not found. Please create TBA first.";
      setState(prev => ({ ...prev, error: errorMsg }));
      notification.error(`🛒 Buy Failed: ${errorMsg}`);
      return false;
    }

    // CRITICAL: Verify Smart Account → TBA mapping before buy
    if (smartAccountAddress && isSmartAccountDeployed) {
      console.log("🔍 Verifying Smart Account → TBA mapping:", {
        userTBA,
        contractLogic: "tbaList[SmartAccount] should equal TBAAddress",
      });

      // Check if Smart Account is properly mapped to TBA
      const { data: smartAccountTBA } = await refetchContractTBA();
      if (!smartAccountTBA || smartAccountTBA === "0x0000000000000000000000000000000000000000") {
        const errorMsg = "Smart Account not mapped to TBA. Please wait for TBA creation to complete.";
        setState(prev => ({ ...prev, error: errorMsg }));
        notification.error(`🛒 Buy Failed: ${errorMsg}`);
        return false;
      }

      if (smartAccountTBA !== userTBA) {
        console.warn("⚠️ TBA mismatch:", {
          smartAccountTBA,
          userTBA,
          message: "Smart Account TBA doesn't match expected TBA",
        });
      }
    }

    try {
      setState(prev => ({ ...prev, isBuying: true, error: null }));
      notification.info("🛒 Buying ingredient...");

      // Use the regular buyIngredient function (without fees)
      const txHash = await executeGaslessTransaction("buyIngredient", [], 0n);

      if (txHash) {
        setState(prev => ({
          ...prev,
          isBuying: false,
          buyTxHash: txHash,
          error: null,
        }));
        notification.success("🛒 Ingredient bought successfully!");

        // Immediate refetch for instant position update
        if (refetchPlayerPosition && refetchRandomRoll && refetchCanBuy) {
          console.log("🔄 Immediate refetch after successful buy...");
          try {
            await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
            console.log("✅ Immediate refetch completed");
          } catch (refetchError) {
            console.warn("⚠️ Immediate refetch failed:", refetchError);
          }
        }

        return txHash;
      } else {
        throw new Error("🛒 Buy ingredient failed - No transaction hash returned. Please try again.");
      }
    } catch (error: any) {
      console.error("Buy gasless error details:", error);
      const errorMessage = error.message || error.toString() || "🛒 Buy ingredient failed. Please try again.";
      setState(prev => ({
        ...prev,
        isBuying: false,
        error: errorMessage,
      }));
      notification.error(`🛒 Buy Failed: ${errorMessage}`);
      return false;
    } finally {
      // Ensure loading state is always reset
      setState(prev => ({ ...prev, isBuying: false }));
    }
  }, [
    userTBA,
    executeGaslessTransaction,
    refetchPlayerPosition,
    refetchRandomRoll,
    refetchCanBuy,
    refetchContractTBA,
    isSmartAccountDeployed,
    smartAccountAddress,
  ]);

  // Rail travel action
  const handleRail = useCallback(async () => {
    if (!userTBA || userTBA === "0x0000000000000000000000000000000000000000") {
      const errorMsg = "TBA not found. Please create TBA first.";
      setState(prev => ({ ...prev, error: errorMsg }));
      notification.error(`🚂 Rail Failed: ${errorMsg}`);
      return false;
    }

    try {
      setState(prev => ({ ...prev, isRailTraveling: true, error: null }));
      notification.info("🚂 Traveling by rail...");

      const txHash = await executeGaslessTransaction("travelRail", []);

      if (txHash) {
        setState(prev => ({
          ...prev,
          isRailTraveling: false,
          railTxHash: txHash,
          error: null,
        }));
        notification.success("🚂 Rail travel completed!");

        // Immediate refetch for instant position update
        if (refetchPlayerPosition && refetchRandomRoll && refetchCanBuy) {
          console.log("🔄 Immediate refetch after successful rail travel...");
          try {
            await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
            console.log("✅ Immediate refetch completed");
          } catch (refetchError) {
            console.warn("⚠️ Immediate refetch failed:", refetchError);
          }
        }

        return txHash;
      } else {
        throw new Error("🚂 Rail travel failed - No transaction hash returned. Please try again.");
      }
    } catch (error: any) {
      const errorMessage = error.message || "🚂 Rail travel failed. Please try again.";
      setState(prev => ({
        ...prev,
        isRailTraveling: false,
        error: errorMessage,
      }));
      notification.error(`🚂 Rail Failed: ${errorMessage}`);
      return false;
    } finally {
      // Ensure loading state is always reset
      setState(prev => ({ ...prev, isRailTraveling: false }));
    }
  }, [userTBA, executeGaslessTransaction, refetchPlayerPosition, refetchRandomRoll, refetchCanBuy]);

  // Cook food action
  const handleCook = useCallback(async () => {
    if (!userTBA || userTBA === "0x0000000000000000000000000000000000000000") {
      const errorMsg = "TBA not found. Please create TBA first.";
      setState(prev => ({ ...prev, error: errorMsg }));
      notification.error(`👨‍🍳 Cook Failed: ${errorMsg}`);
      return false;
    }

    try {
      setState(prev => ({ ...prev, isCooking: true, error: null }));
      notification.info("👨‍🍳 Cooking hamburger...");

      const txHash = await executeGaslessTransaction("mintFoodNFT", []);

      if (txHash) {
        setState(prev => ({
          ...prev,
          isCooking: false,
          cookTxHash: txHash,
          error: null,
        }));
        notification.success("👨‍🍳 Hamburger cooked successfully!");

        // Immediate refetch for instant position update
        if (refetchPlayerPosition && refetchRandomRoll && refetchCanBuy) {
          console.log("🔄 Immediate refetch after successful cook...");
          try {
            await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
            console.log("✅ Immediate refetch completed");
          } catch (refetchError) {
            console.warn("⚠️ Immediate refetch failed:", refetchError);
          }
        }

        return txHash;
      } else {
        throw new Error("👨‍🍳 Cook food failed - No transaction hash returned. Please try again.");
      }
    } catch (error: any) {
      console.error("Cook gasless error details:", error);
      const errorMessage = error.message || error.toString() || "👨‍🍳 Cook food failed. Please try again.";
      setState(prev => ({
        ...prev,
        isCooking: false,
        error: errorMessage,
      }));
      notification.error(`👨‍🍳 Cook Failed: ${errorMessage}`);
      return false;
    } finally {
      // Ensure loading state is always reset
      setState(prev => ({ ...prev, isCooking: false }));
    }
  }, [userTBA, executeGaslessTransaction, refetchPlayerPosition, refetchRandomRoll, refetchCanBuy]);

  // Faucet action - sends to Smart Account
  const handleFaucetMon = useCallback(
    async (isOnStove: boolean) => {
      if (!userTBA || userTBA === "0x0000000000000000000000000000000000000000") {
        const errorMsg = "TBA not found. Please create TBA first.";
        setState(prev => ({ ...prev, error: errorMsg }));
        notification.error(`💧 Faucet Failed: ${errorMsg}`);
        return false;
      }

      if (!isOnStove) {
        const errorMsg = "Must be on stove to use faucet";
        setState(prev => ({ ...prev, error: errorMsg }));
        notification.error(`💧 Faucet Failed: ${errorMsg}`);
        return false;
      }

      try {
        setState(prev => ({ ...prev, isUsingFaucet: true, error: null }));
        notification.info("💧 Using faucet...");

        const txHash = await executeGaslessTransaction("useFaucetMon", []);

        if (txHash) {
          setState(prev => ({
            ...prev,
            isUsingFaucet: false,
            faucetTxHash: txHash,
            error: null,
          }));
          notification.success("💧 Faucet used successfully!");

          // Immediate refetch for instant position update
          if (refetchPlayerPosition && refetchRandomRoll && refetchCanBuy) {
            console.log("🔄 Immediate refetch after successful faucet...");
            try {
              await Promise.all([refetchPlayerPosition(), refetchRandomRoll(), refetchCanBuy()]);
              console.log("✅ Immediate refetch completed");
            } catch (refetchError) {
              console.warn("⚠️ Immediate refetch failed:", refetchError);
            }
          }

          return txHash;
        } else {
          throw new Error("💧 Faucet action failed - No transaction hash returned. Please try again.");
        }
      } catch (error: any) {
        const errorMessage = error.message || "💧 Faucet action failed. Please try again.";
        setState(prev => ({
          ...prev,
          isUsingFaucet: false,
          error: errorMessage,
        }));
        notification.error(`💧 Faucet Failed: ${errorMessage}`);
        return false;
      } finally {
        // Ensure loading state is always reset
        setState(prev => ({ ...prev, isUsingFaucet: false }));
      }
    },
    [userTBA, executeGaslessTransaction, refetchPlayerPosition, refetchRandomRoll, refetchCanBuy],
  );
  // Clear state
  const clearState = useCallback(() => {
    setState({
      isRolling: false,
      isBuying: false,
      isRailTraveling: false,
      isCooking: false,
      isUsingFaucet: false,
      error: null,
      rollTxHash: null,
      buyTxHash: null,
      railTxHash: null,
      cookTxHash: null,
      faucetTxHash: null,
    });
  }, []);

  return {
    ...state,
    handleRoll,
    handleBuy,
    handleRail,
    handleCook,
    handleFaucetMon,
    clearState,
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
    usingSmartAccountTBA,
  };
};
