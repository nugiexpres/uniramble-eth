import React, { useCallback, useMemo, useState } from "react";
import { Implementation, toMetaMaskSmartAccount } from "@metamask/delegation-toolkit";
import { encodeFunctionData, http, parseEther } from "viem";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { getBundlerConfig } from "~~/config/bundler";
import { useFoodScrambleData } from "~~/hooks/board/useFoodScrambleData";
// import { useSmartAccountNFTs } from "~~/hooks/envio/useSmartAccountNFTs"; // TODO next update
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth/useDeployedContractInfo";
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

// ABIs are sourced from the dynamic contracts registry. TODO: next update menggunakan deployedContracts.ts

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

  // Get ChefNFTs directly from ChefNFT contract for Smart Account
  const { data: smartAccountNFTsRaw, refetch: refetchSmartAccountNFTs } = useScaffoldReadContract({
    contractName: "ChefNFT",
    functionName: "getMyChefNFTs",
    args: smartAccountAddress ? [smartAccountAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!smartAccountAddress && !!isSmartAccountDeployed,
      refetchInterval: 5000, // Auto-refresh every 5 seconds
    },
  });

  // Convert NFT data to consistent format
  const smartAccountNFTs = useMemo(() => {
    if (!smartAccountNFTsRaw || !Array.isArray(smartAccountNFTsRaw)) return [];
    return smartAccountNFTsRaw as bigint[];
  }, [smartAccountNFTsRaw]);

  const nftCount = smartAccountNFTs.length;
  const latestNFT = smartAccountNFTs.length > 0 ? smartAccountNFTs[smartAccountNFTs.length - 1] : undefined;
  const nftsLoading = false; // Direct contract reads are synchronous

  // Resolve contract addresses/abis via Scaffold-ETH deployedContracts mapping
  const { data: chefNFTInfo } = useDeployedContractInfo({ contractName: "ChefNFT" });
  const { data: foodNFTInfo } = useDeployedContractInfo({ contractName: "FoodNFT" });
  const { data: foodScrambleInfo } = useDeployedContractInfo({ contractName: "FoodScramble" });
  const { data: erc6551RegistryInfo } = useDeployedContractInfo({ contractName: "ERC6551Registry" });
  const { data: erc6551AccountInfo } = useDeployedContractInfo({ contractName: "ERC6551Account" });

  const chefNFTAddress = chefNFTInfo?.address;
  const foodNFTAddress = foodNFTInfo?.address;
  const foodScrambleAddress = foodScrambleInfo?.address;
  const erc6551RegistryAddress = erc6551RegistryInfo?.address;
  const erc6551AccountAddress = erc6551AccountInfo?.address;

  const chefNFTAbi = useMemo(() => chefNFTInfo?.abi || [], [chefNFTInfo?.abi]);
  // const foodNFTAbi = useMemo(() => foodNFTInfo?.abi || [], [foodNFTInfo?.abi]);
  const foodScrambleAbi = useMemo(() => foodScrambleInfo?.abi || [], [foodScrambleInfo?.abi]);

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
    foodNFTAddress,
    erc6551RegistryAddress,
    erc6551AccountAddress,
  });

  // Debug TBA data
  console.log("TBA data debug:", {
    userTBA,
    tbaExists,
    actualTbaAddress,
    actualTbaCreated,
    smartAccountAddress,
  });

  // Restore TBA and NFT state from localStorage (permanent)
  const restoreTBAState = useCallback(() => {
    if (typeof window === "undefined" || !smartAccountAddress) {
      console.log("Cannot restore TBA state: window undefined or no smart account address");
      return;
    }

    try {
      const storageKey = `tba_state_${smartAccountAddress}`;
      const storedData = localStorage.getItem(storageKey); // Use localStorage for permanent storage
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
          mintTxHash: stateData.mintTxHash, // Restore mint status too
          tokenId: stateData.tokenId ? BigInt(stateData.tokenId) : null,
        }));

        console.log("TBA state restored successfully from localStorage");
      } else {
        console.log("No TBA state found in localStorage");
      }
    } catch (error) {
      console.error("Failed to restore TBA state:", error);
    }
  }, [smartAccountAddress]);

  // Save TBA state to localStorage (permanent)
  const saveTBAState = useCallback(
    (tbaData: {
      tbaAddress: string;
      tbaTxHash: string;
      tbaCreated: boolean;
      mintTxHash?: string;
      tokenId?: string;
    }) => {
      if (typeof window === "undefined" || !smartAccountAddress) {
        console.log("Cannot save TBA state: window undefined or no smart account address");
        return;
      }

      try {
        const storageKey = `tba_state_${smartAccountAddress}`;
        localStorage.setItem(storageKey, JSON.stringify(tbaData)); // Use localStorage for permanent storage
        console.log("TBA state saved to localStorage:", tbaData);
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
        transport: http(bundlerConfig.paymasterUrl),
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

  // Read current mint price from ChefNFT contract
  const { data: currentMintPrice, refetch: refetchMintPrice } = useScaffoldReadContract({
    contractName: "ChefNFT",
    functionName: "mintPrice",
  });

  // Check if Smart Account has NFTs by checking array length
  const hasNFTs = smartAccountNFTs && smartAccountNFTs.length > 0;

  // Debug: Log NFT data from direct contract reads
  React.useEffect(() => {
    console.log("📊 useGaslessTBA - Smart Account NFTs from Contract:", {
      smartAccountAddress,
      nftCount,
      smartAccountNFTs: smartAccountNFTs.map(id => id.toString()),
      latestNFT: latestNFT?.toString(),
      nftsLoading,
      rawData: smartAccountNFTsRaw,
    });
  }, [smartAccountNFTs, smartAccountAddress, nftCount, latestNFT, nftsLoading, smartAccountNFTsRaw]);

  // Gasless mint NFT to smart account using MetaMask Smart Account
  const mintNFTGasless = useCallback(async () => {
    if (!isConnected || !address || !smartAccountAddress || !isSmartAccountDeployed) {
      setState(prev => ({ ...prev, error: "Smart account not available" }));
      return false;
    }

    if (!chefNFTAddress) {
      setState(prev => ({ ...prev, error: "ChefNFT contract address not found" }));
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
    const mintPrice = currentMintPrice ?? parseEther("0.01"); // Use 0n (contract) if provided; only fallback when undefined

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

      // Encode mint function call based on ChefNFT.sol
      // mintChef(address _to, string memory _tokenURI_) external payable returns (uint256)
      const mintData = encodeFunctionData({
        abi: chefNFTAbi,
        functionName: "mintChef",
        args: [smartAccountAddress as `0x${string}`, "chef-nft"], // Mint to smart account with tokenURI
      });

      // Prepare user operation with proper nonce handling
      const userOperation = await bundlerClient.prepareUserOperation({
        account: smartAccountInstance,
        calls: [
          {
            to: chefNFTAddress as `0x${string}`,
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

      // Initially set state without tokenId (will be updated after refresh)
      setState(prev => ({
        ...prev,
        isMinting: false,
        mintTxHash: userOperationHash,
        error: null,
      }));

      // Wait for transaction to be mined before refreshing
      console.log("⏳ Waiting for transaction to be mined...");
      try {
        const receipt = await bundlerClient.waitForUserOperationReceipt({
          hash: userOperationHash,
        });
        console.log("✅ Transaction mined! Receipt:", receipt);

        // Refetch smart account NFTs after transaction is confirmed
        console.log("🔄 Refreshing smart account NFTs after mint confirmation...");
        await refetchSmartAccountNFTs();
        console.log("📊 Current NFTs:", {
          nftCount,
          smartAccountNFTs: smartAccountNFTs.map(id => id.toString()),
        });

        // Extract and save tokenId after successful refresh
        if (smartAccountNFTs && smartAccountNFTs.length > 0) {
          const lastNFT = smartAccountNFTs[smartAccountNFTs.length - 1];
          let extractedTokenId = BigInt(0);

          if (typeof lastNFT === "bigint") {
            extractedTokenId = lastNFT;
          } else if (typeof lastNFT === "number") {
            extractedTokenId = BigInt(lastNFT);
          } else if (typeof lastNFT === "string") {
            extractedTokenId = BigInt(lastNFT);
          }

          console.log("📊 Extracted tokenId after mint:", extractedTokenId.toString());

          // Update state with tokenId
          setState(prev => ({
            ...prev,
            tokenId: extractedTokenId,
          }));

          // Save to localStorage with tokenId
          saveTBAState({
            tbaAddress: state.tbaAddress || "0x",
            tbaTxHash: state.tbaTxHash || "",
            tbaCreated: state.tbaCreated,
            mintTxHash: userOperationHash,
            tokenId: extractedTokenId.toString(),
          });
        }

        // Additional refresh after delay to ensure indexer is updated
        setTimeout(async () => {
          console.log("🔄 Secondary NFT refresh...");
          await refetchSmartAccountNFTs();
          console.log("📊 Second refetch - current NFT count:", nftCount);
        }, 3000);

        // Third refresh for extra reliability
        setTimeout(async () => {
          console.log("🔄 Third NFT refresh...");
          await refetchSmartAccountNFTs();
        }, 6000);
      } catch (receiptError) {
        console.error("Failed to get transaction receipt:", receiptError);
        // Still try to refresh even if receipt fails
        setTimeout(() => {
          refetchSmartAccountNFTs();
          console.log("Refreshing smart account NFTs after mint (fallback)...");
        }, 2000);
      }

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
    isSmartAccountDeployed,
    setupClients,
    targetNetwork,
    walletClient,
    chefNFTAddress,
    chefNFTAbi,
    currentMintPrice,
    refetchSmartAccountNFTs,
    saveTBAState,
    state.tbaAddress,
    state.tbaCreated,
    state.tbaTxHash,
    nftCount,
    smartAccountNFTs,
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

      if (!foodScrambleAddress || !erc6551AccountAddress || !chefNFTAddress) {
        const error = `Contract addresses not found for chain ${targetNetwork.id} (${targetNetwork.name})`;
        console.error("❌ createTBAGasless failed:", error, {
          foodScrambleAddress,
          erc6551AccountAddress,
          chefNFTAddress,
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

      // Check if Smart Account has ChefNFTs
      if (!smartAccountNFTs || smartAccountNFTs.length === 0) {
        const errorMsg = "❌ No Chef NFT found. Please mint a Chef NFT first to create TBA.";
        console.error("❌ createTBAGasless failed:", errorMsg);
        setState(prev => ({ ...prev, error: errorMsg }));
        notification.error("Chef NFT Required - Please mint a Chef NFT first");
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
          chefNFTAddress,
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
            chefNFTAddress as `0x${string}`, // tokenContract (ChefNFT)
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

        // Save TBA state to localStorage
        saveTBAState({
          tbaAddress: "0x", // Will be updated when we refetch from contract
          tbaTxHash: userOperationHash,
          tbaCreated: true,
          mintTxHash: state.mintTxHash || undefined,
          tokenId: tokenId.toString(),
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

          // Save TBA state to localStorage
          saveTBAState({
            tbaAddress: userTBA || "0x",
            tbaTxHash: "0x",
            tbaCreated: true,
            mintTxHash: state.mintTxHash || undefined,
            tokenId: state.tokenId?.toString(),
          });

          notification.success("TBA already exists and is now active!");
          return { userOperationHash: "0x", tbaAddress: userTBA || "0x" };
        }

        // Handle specific contract and Paymaster errors
        let userFriendlyMessage = errorMessage;
        let isPaymasterError = false;

        // Check for ChefNFT-specific errors
        if (errorMessage.includes("Must use ChefNFT contract")) {
          userFriendlyMessage = "❌ Invalid NFT contract - Must use Chef NFT";
        } else if (errorMessage.includes("ChefNFT does not exist")) {
          userFriendlyMessage = "❌ Chef NFT not found - Please mint a Chef NFT first";
        } else if (errorMessage.includes("Invalid ChefNFT owner")) {
          userFriendlyMessage = "❌ Invalid Chef NFT owner - NFT may not exist";
        } else if (errorMessage.includes("TBA already exists for this user")) {
          userFriendlyMessage = "✅ TBA already created - Account is ready to use";
        } else if (errorMessage.includes("UserOperation reverted during simulation")) {
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
          userFriendlyMessage = "❌ No Chef NFTs found - Please mint a Chef NFT first";
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
      chefNFTAddress,
      foodScrambleAbi,
      saveTBAState,
      state.mintTxHash,
      state.tbaTxHash,
      state.tokenId,
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

    // Clear localStorage
    if (typeof window !== "undefined" && smartAccountAddress) {
      const storageKey = `tba_state_${smartAccountAddress}`;
      localStorage.removeItem(storageKey);
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
    nftCount,
    latestNFT,
    nftsLoading,
    refetchSmartAccountNFTs,
    // TBA data from contract
    tbaAddress: actualTbaAddress,
    tbaCreated: actualTbaCreated,
    // Contract addresses
    chefNFTAddress,
    foodNFTAddress,
    foodScrambleAddress,
    erc6551RegistryAddress,
    erc6551AccountAddress,
    // Dynamic mint price (keep 0n from contract; fallback only if undefined)
    currentMintPrice: currentMintPrice ?? parseEther("0.01"),
    refetchMintPrice,
    // Smart Account balance
    smartAccountBalance: state.smartAccountBalance,
    // Smart Account NFT status
    hasNFTs: hasNFTs || false,
  };
};
