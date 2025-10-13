import React, { useCallback, useState } from "react";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { encodeFunctionData, http, parseEther } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import deployedContracts from "~~/contracts/deployedContracts";
import { useFoodScrambleData } from "~~/hooks/board/useFoodScrambleData";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useFinalSmartAccount } from "~~/hooks/smart-account/useFinalSmartAccount";
import { emitCreateTBAEvent, emitMintNFTEvent } from "~~/utils/envio/emitGameEvent";
import { notification } from "~~/utils/scaffold-eth";

interface GaslessTBAState {
  isMinting: boolean;
  isCreatingTBA: boolean;
  mintTxHash: string | null;
  tbaTxHash: string | null;
  error: string | null;
  tbaAddress: string | null;
  tbaCreated: boolean;
  tokenId: bigint | null;
  smartAccountBalance: bigint | null;
}

// Get contract ABI from deployedContracts using Scaffold-ETH v2 pattern
const getContractABI = (chainId: number, contractName: string) => {
  const contracts = deployedContracts as Record<number, any>;
  return contracts[chainId]?.[contractName]?.abi || [];
};

export const useGaslessTBA = () => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { targetNetwork } = useTargetNetwork();
  const publicClient = usePublicClient(); // Use wagmi's public client (configured with Alchemy)

  // Get smart account state
  const { smartAccountAddress, isDeployed: isSmartAccountDeployed } = useFinalSmartAccount();

  // Get TBA data from FoodScramble contract
  const { userTBA, refetchUserTBA } = useFoodScrambleData({
    address: smartAccountAddress as `0x${string}`,
    enableWatch: true,
  });

  // Get contract addresses from deployedContracts
  const contracts = deployedContracts as Record<number, any>;
  const foodNFTAddress = contracts[targetNetwork.id]?.FoodNFT?.address;
  const foodScrambleAddress = contracts[targetNetwork.id]?.FoodScramble?.address;
  const erc6551RegistryAddress = contracts[targetNetwork.id]?.ERC6551Registry?.address;
  const erc6551AccountAddress = contracts[targetNetwork.id]?.ERC6551Account?.address;

  // Get contract ABIs
  const foodNFTAbi = getContractABI(targetNetwork.id, "FoodNFT");
  const foodScrambleAbi = getContractABI(targetNetwork.id, "FoodScramble");

  const [state, setState] = useState<GaslessTBAState>({
    isMinting: false,
    isCreatingTBA: false,
    mintTxHash: null,
    tbaTxHash: null,
    error: null,
    tbaAddress: null,
    tbaCreated: false,
    tokenId: null,
    smartAccountBalance: null,
  });

  // Check if TBA exists from contract
  const tbaExists = userTBA && userTBA !== "0x0000000000000000000000000000000000000000";
  const actualTbaAddress = tbaExists ? userTBA : state.tbaAddress;
  const actualTbaCreated = tbaExists || state.tbaCreated;

  // Debug logging
  console.log("Contract addresses debug:", {
    chainId: targetNetwork.id,
    availableChains: Object.keys(contracts),
    foodNFTAddress,
    erc6551RegistryAddress,
    erc6551AccountAddress,
    contractsForChain: contracts[targetNetwork.id],
  });

  // Debug TBA data
  console.log("TBA data debug:", {
    userTBA,
    tbaExists,
    actualTbaAddress,
    actualTbaCreated,
    smartAccountAddress,
  });

  // Restore TBA state from session storage
  const restoreTBAState = useCallback(() => {
    if (typeof window === "undefined" || !smartAccountAddress) {
      console.log("Cannot restore TBA state: window undefined or no smart account address");
      return;
    }

    try {
      const storageKey = `tba_state_${smartAccountAddress}`;
      const storedData = sessionStorage.getItem(storageKey);
      console.log("TBA storage key:", storageKey);
      console.log("TBA stored data:", storedData);

      if (storedData) {
        const stateData = JSON.parse(storedData);
        console.log("Restoring TBA state:", stateData);

        setState(prev => ({
          ...prev,
          tbaAddress: stateData.tbaAddress,
          tbaTxHash: stateData.tbaTxHash,
          tbaCreated: stateData.tbaCreated,
        }));

        console.log("TBA state restored successfully");
      } else {
        console.log("No TBA state found in storage");
      }
    } catch (error) {
      console.error("Failed to restore TBA state:", error);
    }
  }, [smartAccountAddress]);

  // Save TBA state to session storage
  const saveTBAState = useCallback(
    (tbaData: { tbaAddress: string; tbaTxHash: string; tbaCreated: boolean }) => {
      if (typeof window === "undefined" || !smartAccountAddress) {
        console.log("Cannot save TBA state: window undefined or no smart account address");
        return;
      }

      try {
        const storageKey = `tba_state_${smartAccountAddress}`;
        sessionStorage.setItem(storageKey, JSON.stringify(tbaData));
        console.log("TBA state saved:", tbaData);
        console.log("TBA storage key:", storageKey);
      } catch (error) {
        console.error("Failed to save TBA state:", error);
      }
    },
    [smartAccountAddress],
  );

  // Restore state on mount and when smart account changes
  React.useEffect(() => {
    restoreTBAState();
  }, [restoreTBAState]);

  // Setup clients for gasless operations
  // NOTE: For read operations like getBalance, use wagmi's publicClient (Alchemy)
  // Pimlico bundler/paymaster for gasless transactions
  const setupClients = useCallback(() => {
    if (typeof window === "undefined" || !address || !isSmartAccountDeployed) return null;

    if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
      console.error("Pimlico API key not configured");
      return null;
    }

    if (!publicClient) {
      console.error("Public client not available");
      return null;
    }

    try {
      const chainId = targetNetwork.id;
      const bundlerConfig = getBundlerConfig(chainId);

      // Use wagmi's public client for read operations (Alchemy RPC)
      // This provides reliable read operations
      const bundlerClient = createBundlerClient({
        client: publicClient,
        transport: http(bundlerConfig.bundlerUrl),
      });

      const paymasterClient = createPaymasterClient({
        transport: http(bundlerConfig.bundlerUrl),
      });

      return { publicClient, bundlerClient, paymasterClient };
    } catch (error) {
      console.error("Failed to setup clients:", error);
      return null;
    }
  }, [address, isSmartAccountDeployed, targetNetwork, publicClient]);

  // Refresh balance when Smart Account address changes
  React.useEffect(() => {
    if (smartAccountAddress && isSmartAccountDeployed) {
      const refreshBalance = async () => {
        try {
          const clients = setupClients();
          if (clients) {
            const balance = await clients.publicClient.getBalance({
              address: smartAccountAddress as `0x${string}`,
            });
            setState(prev => ({ ...prev, smartAccountBalance: balance }));
            console.log(
              "Smart Account balance refreshed:",
              Number(balance) / 1e18,
              targetNetwork.nativeCurrency.symbol,
            );
          }
        } catch (error) {
          console.error("Failed to refresh balance:", error);
        }
      };

      refreshBalance();
    }
  }, [smartAccountAddress, isSmartAccountDeployed, setupClients, targetNetwork?.nativeCurrency?.symbol]);

  // Read current mint price from contract
  const { data: currentMintPrice } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "mintPrice",
  });

  // Read NFTs owned by smart account
  const { data: smartAccountNFTs, refetch: refetchSmartAccountNFTs } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "getMyNFTs",
    args: [smartAccountAddress as `0x${string}`],
  });

  // Debug: Log NFT data when it changes
  React.useEffect(() => {
    console.log("📊 useGaslessTBA - Smart Account NFTs data:", {
      smartAccountAddress,
      smartAccountNFTs,
      type: typeof smartAccountNFTs,
      isArray: Array.isArray(smartAccountNFTs),
      length: smartAccountNFTs?.length,
      firstNFT: smartAccountNFTs?.[0],
      typeOfFirst: typeof smartAccountNFTs?.[0],
    });
  }, [smartAccountNFTs, smartAccountAddress]);

  // Gasless mint NFT to smart account using MetaMask Smart Account
  const mintNFTGasless = useCallback(async () => {
    if (!isConnected || !address || !smartAccountAddress || !isSmartAccountDeployed) {
      setState(prev => ({ ...prev, error: "Smart account not available" }));
      return false;
    }

    if (!foodNFTAddress) {
      setState(prev => ({ ...prev, error: "FoodNFT contract address not found" }));
      return false;
    }

    if (!walletClient) {
      setState(prev => ({ ...prev, error: "Wallet client not available" }));
      return false;
    }

    // Setup clients first to get publicClient
    const clients = setupClients();
    if (!clients) {
      setState(prev => ({ ...prev, error: "Failed to setup clients" }));
      return false;
    }

    const { publicClient } = clients;

    // Get current mint price from contract
    const mintPrice = currentMintPrice || parseEther("0.01"); // Fallback to 0.01 native token if not available

    try {
      setState(prev => ({ ...prev, isMinting: true, error: null }));

      // Check Smart Account balance before minting
      const smartAccountBalance = await publicClient.getBalance({
        address: smartAccountAddress as `0x${string}`,
      });

      // Update state with current balance
      setState(prev => ({ ...prev, smartAccountBalance }));

      if (!smartAccountBalance || smartAccountBalance < mintPrice) {
        const requiredAmount = Number(mintPrice) / 1e18;
        const currentAmount = Number(smartAccountBalance) / 1e18;
        const errorMsg = `Insufficient balance in Smart Account. Required: ${requiredAmount.toFixed(4)} ${targetNetwork.nativeCurrency.symbol}, Current: ${currentAmount.toFixed(4)} ${targetNetwork.nativeCurrency.symbol}`;
        setState(prev => ({ ...prev, error: errorMsg, isMinting: false }));
        // Don't show notification here - let component handle popup
        return false;
      }

      const { bundlerClient, paymasterClient } = clients;

      // Check if smart account is deployed on-chain
      const code = await publicClient.getCode({ address: smartAccountAddress as `0x${string}` });
      const isActuallyDeployed = code !== undefined && code !== "0x";

      console.log("Smart Account deployment check:", {
        smartAccountAddress,
        isActuallyDeployed,
        code: code?.slice(0, 10),
      });

      // Create MetaMask Smart Account instance - conditional based on deployment status
      const smartAccountInstance = !isActuallyDeployed
        ? // NOT deployed yet - need deployParams
          await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            deployParams: [address as `0x${string}`, [], [], []],
            deploySalt: "0x",
            signer: { walletClient: walletClient },
          })
        : // Already deployed - use address only
          await toMetaMaskSmartAccount({
            client: publicClient,
            implementation: Implementation.Hybrid,
            address: smartAccountAddress as `0x${string}`,
            signer: { walletClient: walletClient },
          });

      // Get current nonce using MetaMask Smart Account's getNonce method
      let nonce;
      try {
        nonce = await smartAccountInstance.getNonce();
        console.log("Smart Account nonce:", nonce);
      } catch (nonceErr) {
        console.error("Failed to read Smart Account nonce in TBA flow:", nonceErr);
        setState(prev => ({ ...prev, error: "Failed to read Smart Account nonce (network error)" }));
        return false;
      }

      // Encode mint function call based on FoodNFT.sol
      // mintChef(address _to, string memory _tokenURI_) external payable returns (uint256)
      const mintData = encodeFunctionData({
        abi: foodNFTAbi,
        functionName: "mintChef",
        args: [smartAccountAddress as `0x${string}`, "chef-nft"], // Mint to smart account with tokenURI
      });

      // Prepare user operation with proper nonce handling
      const userOperation = await bundlerClient.prepareUserOperation({
        account: smartAccountInstance,
        calls: [
          {
            to: foodNFTAddress as `0x${string}`,
            value: mintPrice, // Use dynamic mint price from contract
            data: mintData,
          },
        ],
        paymaster: paymasterClient,
      });

      // Update nonce in user operation
      const userOperationWithNonce = {
        ...userOperation,
        nonce: nonce,
      };

      // Sign the user operation
      const signature = await smartAccountInstance.signUserOperation(userOperationWithNonce);

      // Send the user operation
      const userOperationHash = await bundlerClient.sendUserOperation({
        ...userOperationWithNonce,
        signature: signature,
      });

      console.log("NFT minted gasless! UserOperation Hash:", userOperationHash);

      // Get the latest tokenId from smart account NFTs
      let latestTokenId = BigInt(0);
      if (smartAccountNFTs && Array.isArray(smartAccountNFTs) && smartAccountNFTs.length > 0) {
        const lastNFT = smartAccountNFTs[smartAccountNFTs.length - 1] as any;
        if (lastNFT && lastNFT.tokenId) {
          latestTokenId = BigInt(Number(lastNFT.tokenId));
        }
      }

      setState(prev => ({
        ...prev,
        isMinting: false,
        mintTxHash: userOperationHash,
        tokenId: latestTokenId,
        error: null,
      }));

      // Refetch smart account NFTs after successful mint
      setTimeout(() => {
        refetchSmartAccountNFTs();
        console.log("Refreshing smart account NFTs after mint...");
      }, 2000);

      // Emit event for EnvioAnalytics (optimistic UI update)
      emitMintNFTEvent(address, smartAccountAddress);

      notification.success("ChefNFT minted gasless to smart account!");
      return userOperationHash;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to mint NFT gasless";
      let userFriendlyMessage = errorMessage;

      // Check for specific error patterns
      if (errorMessage.includes("UserOperation reverted during simulation")) {
        if (errorMessage.includes("0x")) {
          // Check if it's an insufficient balance error
          if (errorMessage.includes("insufficient") || errorMessage.includes("balance")) {
            userFriendlyMessage = "Insufficient balance in Smart Account. Please fund your Smart Account first.";
          } else {
            userFriendlyMessage =
              "Transaction failed during simulation. Please check your Smart Account balance and try again.";
          }
        } else {
          userFriendlyMessage =
            "Transaction simulation failed. Please ensure your Smart Account has sufficient balance.";
        }
      } else if (errorMessage.includes("AA25")) {
        userFriendlyMessage = "Invalid nonce error. Please try again.";
      } else if (errorMessage.includes("AA21")) {
        userFriendlyMessage = "Paymaster validation failed. Please try again.";
      } else if (errorMessage.includes("AA31")) {
        userFriendlyMessage = "Paymaster signature validation failed. Please try again.";
      }

      setState(prev => ({
        ...prev,
        isMinting: false,
        error: userFriendlyMessage,
      }));

      // Don't show notification here - let component handle popup
      console.error("Mint error details:", error);
      return false;
    }
  }, [
    isConnected,
    address,
    smartAccountAddress,
    smartAccountNFTs,
    isSmartAccountDeployed,
    setupClients,
    targetNetwork,
    walletClient,
    foodNFTAddress,
    foodNFTAbi,
    currentMintPrice,
    refetchSmartAccountNFTs,
  ]);

  // Gasless create Token Bound Account using MetaMask Smart Account
  const createTBAGasless = useCallback(
    async (tokenId: bigint) => {
      console.log("🚀 createTBAGasless called with:", {
        tokenId: tokenId.toString(),
        chainId: targetNetwork.id,
        chainName: targetNetwork.name,
        isConnected,
        address,
        smartAccountAddress,
        isSmartAccountDeployed,
      });

      if (!isConnected || !address || !smartAccountAddress || !isSmartAccountDeployed) {
        const error = "Smart account not available";
        console.error("❌ createTBAGasless failed:", error);
        setState(prev => ({ ...prev, error }));
        return false;
      }

      // Check if TBA already created (from contract or state)
      if (actualTbaCreated && actualTbaAddress) {
        console.log("✅ TBA already created:", actualTbaAddress);
        notification.info("TBA already created!");
        return { userOperationHash: state.tbaTxHash || "0x", tbaAddress: actualTbaAddress };
      }

      if (!foodScrambleAddress || !erc6551AccountAddress || !foodNFTAddress) {
        const error = `Contract addresses not found for chain ${targetNetwork.id} (${targetNetwork.name})`;
        console.error("❌ createTBAGasless failed:", error, {
          foodScrambleAddress,
          erc6551AccountAddress,
          foodNFTAddress,
        });
        setState(prev => ({ ...prev, error }));
        notification.error(`Contracts not deployed on ${targetNetwork.name}`);
        return false;
      }

      if (!walletClient) {
        const error = "Wallet client not available";
        console.error("❌ createTBAGasless failed:", error);
        setState(prev => ({ ...prev, error }));
        return false;
      }

      // Check if Smart Account has NFTs
      if (!smartAccountNFTs || smartAccountNFTs.length === 0) {
        const errorMsg = "No Chef NFTs found in Smart Account. Please mint a Chef NFT first.";
        console.error("❌ createTBAGasless failed:", errorMsg);
        setState(prev => ({ ...prev, error: errorMsg }));
        // Don't show notification here - let component handle popup
        return false;
      }

      try {
        console.log("✅ All checks passed, starting TBA creation...");
        setState(prev => ({ ...prev, isCreatingTBA: true, error: null }));

        const clients = setupClients();
        if (!clients) {
          const error = `Failed to setup bundler clients for chain ${targetNetwork.id} (${targetNetwork.name})`;
          console.error("❌", error);
          throw new Error(error);
        }

        const { publicClient, bundlerClient, paymasterClient } = clients;

        console.log("🚀 Creating TBA with Paymaster sponsorship on", targetNetwork.name, "...");
        console.log("📦 Using bundler config:", getBundlerConfig(targetNetwork.id));

        // Check if smart account is deployed on-chain
        const code = await publicClient.getCode({ address: smartAccountAddress as `0x${string}` });
        const isActuallyDeployed = code !== undefined && code !== "0x";

        console.log("Smart Account deployment check for TBA:", {
          smartAccountAddress,
          isActuallyDeployed,
          code: code?.slice(0, 10),
        });

        // Create MetaMask Smart Account instance - conditional based on deployment status
        const smartAccountInstance = !isActuallyDeployed
          ? // NOT deployed yet - need deployParams
            await toMetaMaskSmartAccount({
              client: publicClient,
              implementation: Implementation.Hybrid,
              deployParams: [address as `0x${string}`, [], [], []],
              deploySalt: "0x",
              signer: { walletClient: walletClient },
            })
          : // Already deployed - use address only
            await toMetaMaskSmartAccount({
              client: publicClient,
              implementation: Implementation.Hybrid,
              address: smartAccountAddress as `0x${string}`,
              signer: { walletClient: walletClient },
            });

        // Get current nonce using MetaMask Smart Account's getNonce method
        const nonce = await smartAccountInstance.getNonce();

        // Generate unique salt to avoid "Combination already used" error
        // Use timestamp for uniqueness
        const timestamp = Math.floor(Date.now() / 1000);
        const salt = BigInt(timestamp);

        console.log("Smart Account nonce for TBA creation:", nonce);
        console.log("TBA creation parameters:", {
          erc6551AccountAddress,
          chainId: targetNetwork.id,
          foodNFTAddress,
          tokenId: tokenId.toString(),
          salt: salt.toString(),
          smartAccountAddress,
        });

        // Encode createTokenBoundAccount function call to FoodScramble (same pattern as mint NFT)
        // createTokenBoundAccount(address _implementation, uint256 _chainId, address _tokenContract, uint256 _tokenId, uint256 _salt, bytes calldata _initData)
        const createAccountData = encodeFunctionData({
          abi: foodScrambleAbi,
          functionName: "createTokenBoundAccount",
          args: [
            erc6551AccountAddress as `0x${string}`, // implementation
            BigInt(targetNetwork.id), // chainId
            foodNFTAddress as `0x${string}`, // tokenContract (FoodNFT)
            tokenId, // tokenId
            salt, // salt - use timestamp to avoid "combination already used"
            "0x" as `0x${string}`, // initData (empty - registry handles initialization)
          ],
        });

        // Prepare user operation - let bundler/paymaster handle gas estimation
        const userOperation = await bundlerClient.prepareUserOperation({
          account: smartAccountInstance,
          calls: [
            {
              to: foodScrambleAddress as `0x${string}`, // Call FoodScramble like mint NFT calls FoodNFT
              value: 0n,
              data: createAccountData,
            },
          ],
          paymaster: paymasterClient,
          // Let bundler/paymaster handle gas estimation automatically
        });

        // Update nonce in user operation
        const userOperationWithNonce = {
          ...userOperation,
          nonce: nonce,
        };

        // Sign the user operation
        const signature = await smartAccountInstance.signUserOperation(userOperationWithNonce);

        // Send the user operation
        const userOperationHash = await bundlerClient.sendUserOperation({
          ...userOperationWithNonce,
          signature: signature,
        });

        console.log("🎉 TBA created gasless! UserOperation Hash:", userOperationHash);

        // FoodScramble.createTokenBoundAccount already handles:
        // 1. Registry.createAccount call
        // 2. tbaList[msg.sender] = newTBA mapping
        // 3. createPlayer(newTBA) call
        // So we don't need additional logic here!

        // Update state
        setState(prev => ({
          ...prev,
          isCreatingTBA: false,
          tbaTxHash: userOperationHash,
          tbaCreated: true,
          error: null,
        }));

        // Save TBA state to session storage
        saveTBAState({
          tbaAddress: "0x", // Will be updated when we refetch from contract
          tbaTxHash: userOperationHash,
          tbaCreated: true,
        });

        // Emit event for EnvioAnalytics (optimistic UI update)
        emitCreateTBAEvent(smartAccountAddress, "0x", tokenId.toString());

        notification.success("🎉 TBA created gasless with Paymaster sponsorship!");
        return { userOperationHash, tbaAddress: "0x" };
      } catch (error: any) {
        const errorMessage = error.message || "Failed to create TBA gasless";

        // Check if error is "Account already exists" or "Combination already used"
        if (
          errorMessage.includes("Account already exists") ||
          errorMessage.includes("Combination already used") ||
          errorMessage.includes("already exists") ||
          errorMessage.includes("already used") ||
          errorMessage.includes("436f6d62696e6174696f6e20616c72656164792075736564") // Hex encoded "combination already used"
        ) {
          console.log("TBA already exists, refreshing from contract");

          // Refetch TBA from contract
          await refetchUserTBA();

          setState(prev => ({
            ...prev,
            isCreatingTBA: false,
            tbaCreated: true,
            error: null,
          }));

          // Save TBA state to session storage
          saveTBAState({
            tbaAddress: userTBA || "0x",
            tbaTxHash: "0x",
            tbaCreated: true,
          });

          notification.success("TBA already exists and is now active!");
          return { userOperationHash: "0x", tbaAddress: userTBA || "0x" };
        }

        // Handle Paymaster-specific errors
        let userFriendlyMessage = errorMessage;
        let isPaymasterError = false;

        // Check for Paymaster errors
        if (errorMessage.includes("UserOperation reverted during simulation")) {
          // Decode error reason 0x741752c2
          if (errorMessage.includes("0x741752c2")) {
            userFriendlyMessage =
              "❌ Paymaster out of budget - Gas sponsorship unavailable. Please try again later or contact support.";
            isPaymasterError = true;
          } else if (errorMessage.includes("AA21")) {
            userFriendlyMessage = "❌ Paymaster validation failed - Service unavailable";
            isPaymasterError = true;
          } else if (errorMessage.includes("AA31")) {
            userFriendlyMessage = "❌ Paymaster signature validation failed";
            isPaymasterError = true;
          } else if (errorMessage.includes("AA25")) {
            userFriendlyMessage = "❌ Invalid nonce error - Please try again";
          } else {
            userFriendlyMessage = "❌ Transaction failed during simulation - Please try again";
          }
        } else if (errorMessage.includes("0x741752c2")) {
          // Direct error code check (fallback)
          userFriendlyMessage =
            "❌ Paymaster out of budget - Gas sponsorship unavailable. Please try again later or contact support.";
          isPaymasterError = true;
        } else if (errorMessage.includes("No NFTs found") || errorMessage.includes("no NFTs")) {
          userFriendlyMessage = "No Chef NFTs found in Smart Account. Please mint a Chef NFT first.";
        } else if (errorMessage.includes("Combination already used")) {
          userFriendlyMessage = "❌ TBA combination already exists - Try again with different salt";
        } else if (errorMessage.includes("Account already exists")) {
          userFriendlyMessage = "❌ TBA account already exists - Try again with different salt";
        } else if (errorMessage.includes("Must mint ChefNFT first")) {
          userFriendlyMessage = "❌ No Chef NFT found - Please mint a Chef NFT first";
        }

        setState(prev => ({
          ...prev,
          isCreatingTBA: false,
          error: userFriendlyMessage,
        }));

        // Handle Paymaster error - pure gasless approach (no Smart Account balance fallback)
        if (isPaymasterError) {
          // Set specific error message for Paymaster issues with retry suggestion
          setState(prev => ({
            ...prev,
            error: `🚫 Paymaster Sponsorship Failed - Gas sponsorship unavailable. Please try again in a few minutes or contact support if the issue persists.`,
          }));
        }

        // Don't show notification here - let component handle popup

        console.error("TBA creation error details:", error);
        return false;
      }
    },
    [
      isConnected,
      address,
      smartAccountAddress,
      isSmartAccountDeployed,
      setupClients,
      targetNetwork,
      walletClient,
      foodScrambleAddress,
      erc6551AccountAddress,
      foodNFTAddress,
      foodScrambleAbi,
      state.tbaTxHash,
      saveTBAState,
      refetchUserTBA,
      userTBA,
      actualTbaAddress,
      actualTbaCreated,
      smartAccountNFTs,
    ],
  );

  // Clear state
  const clearState = useCallback(() => {
    setState({
      isMinting: false,
      isCreatingTBA: false,
      mintTxHash: null,
      tbaTxHash: null,
      error: null,
      tbaAddress: null,
      tbaCreated: false,
      tokenId: null,
      smartAccountBalance: null,
    });

    // Clear session storage
    if (typeof window !== "undefined" && smartAccountAddress) {
      const storageKey = `tba_state_${smartAccountAddress}`;
      sessionStorage.removeItem(storageKey);
    }
  }, [smartAccountAddress]);

  return {
    ...state,
    mintNFTGasless,
    createTBAGasless,
    clearState,
    isSmartAccountDeployed,
    smartAccountAddress,
    smartAccountNFTs: smartAccountNFTs || [],
    refetchSmartAccountNFTs,
    // TBA data from contract
    tbaAddress: actualTbaAddress,
    tbaCreated: actualTbaCreated,
    // Contract addresses
    foodNFTAddress,
    foodScrambleAddress,
    erc6551RegistryAddress,
    erc6551AccountAddress,
    // Dynamic mint price
    currentMintPrice: currentMintPrice || parseEther("0.01"),
    // Smart Account balance
    smartAccountBalance: state.smartAccountBalance,
  };
};
