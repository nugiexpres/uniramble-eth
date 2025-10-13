import { useCallback, useEffect, useMemo, useState } from "react";
import { parseEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import {
  useScaffoldReadContract,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export interface UseCreateTBAReturn {
  // State
  selectedNFT: number;
  setSelectedNFT: (nftId: number) => void;
  isMinted: boolean;
  isAccountCreated: boolean;
  isLoading: {
    mint: boolean;
    create: boolean;
  };
  showSuccess: boolean;
  setShowSuccess: (show: boolean) => void;

  // Data
  nfts: bigint[];
  mintPrice: bigint;
  chefMinted: boolean;
  accountReady: boolean;

  // Actions
  handleMintChef: () => Promise<void>;
  handleCreateAccount: () => Promise<void>;

  // Computed
  canMint: boolean;
  canCreateAccount: boolean;
  hasNFTs: boolean;
}

export const useCreateTBA = (): UseCreateTBAReturn => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { targetNetwork } = useTargetNetwork();

  // Local state
  const [selectedNFT, setSelectedNFT] = useState(0);
  const [isLoading, setIsLoading] = useState({ mint: false, create: false });
  const [showSuccess, setShowSuccess] = useState(false);

  // Read contract data
  const { data: chefMintedData, isLoading: chefMintedLoading } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "minted",
    args: address ? [address] : [""],
  });

  const { data: nftsData } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "getMyNFTs",
    args: address ? [address] : [""],
  });

  const { data: mintPriceData } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "mintPrice",
  });

  const { data: accountReadyData, isLoading: accountReadyLoading } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "accountReady",
    args: address ? [address] : [""],
  });

  // Write contract functions
  const { writeContractAsync: mintChefNFT } = useScaffoldWriteContract({
    contractName: "FoodNFT",
  });

  const { writeContractAsync: createTBA } = useScaffoldWriteContract({
    contractName: "FoodScramble",
  });

  // Watch for events
  useScaffoldWatchContractEvent({
    contractName: "FoodNFT",
    eventName: "Transfer",
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const { to, tokenId } = log.args as { to: string; tokenId: bigint };
        if (to === address && log.args.from === "0x0000000000000000000000000000000000000000") {
          console.log("✅ NFT Minted:", tokenId);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      });
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "FoodScramble",
    eventName: "PlayerCreated",
    onLogs: (logs: any[]) => {
      logs.forEach((log: any) => {
        const { tba, gridIndex } = log.args as { tba: string; gridIndex: bigint };
        console.log("✅ PlayerCreated:", tba, gridIndex);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      });
    },
  });

  // Computed values
  const nfts = useMemo(() => (Array.isArray(nftsData) ? nftsData : []), [nftsData]);
  const isMinted = Boolean(chefMintedData);
  const isAccountCreated = Boolean(accountReadyData);
  const mintPrice = mintPriceData || parseEther("0.01");
  const hasNFTs = nfts.length > 0;

  const canMint = isConnected && !isMinted && !isLoading.mint && !chefMintedLoading;
  const canCreateAccount = isConnected && hasNFTs && !isAccountCreated && !isLoading.create && !accountReadyLoading;

  // Actions
  const handleMintChef = useCallback(async () => {
    if (!canMint || !mintChefNFT) return;

    try {
      setIsLoading(prev => ({ ...prev, mint: true }));
      await mintChefNFT({
        functionName: "mintChef",
        args: [
          address!,
          "https://vyz7xsowfsqc7gdcdol56hu64mt6cdykt2ciyvwdpuxuncphrm6a.ar.4everland.io/rjP7ydYsoC-YYhuX3x6e4yfhDwqehIxWw30vRonnizw?",
        ],
        value: mintPrice,
      });
      setIsLoading(prev => ({ ...prev, mint: false }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Mint error:", error);
      setIsLoading(prev => ({ ...prev, mint: false }));
      throw error;
    }
  }, [canMint, mintChefNFT, address, mintPrice]);

  const handleCreateAccount = useCallback(async () => {
    if (!canCreateAccount || !createTBA || !nfts.length) {
      console.log("Cannot create account:", { canCreateAccount, createTBA: !!createTBA, nftsLength: nfts.length });
      return;
    }

    // Get contract addresses from deployedContracts
    const contracts = deployedContracts as Record<number, any>;
    const currentChainId = chainId || targetNetwork.id; // Default to target network if chainId is not available
    const erc6551AccountAddress = contracts[currentChainId]?.ERC6551Account?.address ?? "";
    const foodNFTAddress = contracts[currentChainId]?.FoodNFT?.address ?? "";

    console.log("Contract addresses lookup:", {
      chainId,
      currentChainId,
      availableChains: Object.keys(contracts),
      erc6551AccountAddress,
      foodNFTAddress,
      contractsForChain: contracts[currentChainId],
    });

    if (!erc6551AccountAddress || !foodNFTAddress) {
      console.error("Missing contract addresses:", { erc6551AccountAddress, foodNFTAddress });
      return;
    }

    console.log("Starting TBA creation with:", {
      erc6551AccountAddress,
      chainId: chainId || 1,
      foodNFTAddress,
      tokenId: nfts[selectedNFT],
      selectedNFT,
    });

    try {
      setIsLoading(prev => ({ ...prev, create: true }));

      const txHash = await createTBA({
        functionName: "createTokenBoundAccount",
        args: [
          erc6551AccountAddress,
          BigInt(chainId || 1),
          foodNFTAddress,
          nfts[0] || BigInt(0), // Only 1 ChefNFT per user, use index 0
          BigInt(Math.floor(Date.now() / 1000)),
          "0x",
        ],
      });

      console.log("TBA creation transaction submitted:", txHash);
      setIsLoading(prev => ({ ...prev, create: false }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Create account error:", error);
      setIsLoading(prev => ({ ...prev, create: false }));

      // Show user-friendly error message
      if (error.message?.includes("user rejected")) {
        alert("Transaction cancelled by user");
      } else if (error.message?.includes("insufficient funds")) {
        alert("Insufficient funds for gas");
      } else {
        alert(`Failed to create TBA: ${error.message || "Unknown error"}`);
      }

      throw error;
    }
  }, [canCreateAccount, createTBA, nfts, selectedNFT, chainId]);

  // Update selected NFT when NFTs change
  useEffect(() => {
    if (nfts.length > 0 && selectedNFT >= nfts.length) {
      setSelectedNFT(0);
    }
  }, [nfts.length, selectedNFT]);

  return {
    // State
    selectedNFT,
    setSelectedNFT,
    isMinted,
    isAccountCreated,
    isLoading,
    showSuccess,
    setShowSuccess,

    // Data
    nfts,
    mintPrice,
    chefMinted: isMinted,
    accountReady: isAccountCreated,

    // Actions
    handleMintChef,
    handleCreateAccount,

    // Computed
    canMint,
    canCreateAccount,
    hasNFTs,
  };
};
