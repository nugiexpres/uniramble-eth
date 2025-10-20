import { useEffect, useMemo, useState } from "react";
import { GET_ALL_NFT_TRANSFERS, GET_NFTS_BY_OWNER, NFT_TRANSFER_SUBSCRIPTION } from "./queries";
import { useEnvioClient } from "./useEnvioClient";
import { useQuery, useSubscription } from "@apollo/client/react";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";

interface NFTTransfer {
  id: string;
  from: string;
  to: string;
  tokenId: string;
  db_write_timestamp: string;
}

interface NFTQueryResponse {
  FoodNFT_Transfer: NFTTransfer[];
}

interface NFTSubscriptionResponse {
  FoodNFT_Transfer: NFTTransfer[];
}

/**
 * Hook untuk mendapatkan NFT yang dimiliki oleh Smart Account dari Envio indexer
 * Lebih cepat dan reliable daripada contract call
 */
export const useSmartAccountNFTs = (smartAccountAddress?: string) => {
  const { chainId } = useEnvioClient();
  const [nftTransfers, setNftTransfers] = useState<NFTTransfer[]>([]);

  // Normalize address to lowercase
  const normalizedAddress = smartAccountAddress?.toLowerCase();

  // Fallback: Read NFTs directly from contract if Envio doesn't detect them
  const { data: contractNFTs, refetch: refetchContractNFTs } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "getMyNFTs",
    args: smartAccountAddress
      ? [smartAccountAddress as `0x${string}`]
      : ["0x0000000000000000000000000000000000000000" as `0x${string}`],
    query: {
      enabled: !!smartAccountAddress && smartAccountAddress.length === 42, // Must be valid address
    },
  });

  // Query NFT transfers ke smart account
  const {
    data: nftData,
    loading,
    error,
    refetch,
  } = useQuery<NFTQueryResponse>(GET_NFTS_BY_OWNER, {
    variables: { owner: normalizedAddress || "" }, // Provide default empty string to avoid null
    skip: !normalizedAddress || !smartAccountAddress, // Skip if no address
    pollInterval: normalizedAddress ? 5000 : undefined, // Only poll if we have an address
    fetchPolicy: "network-only", // Always fetch from network, bypass cache
  });

  // Debug query state
  useEffect(() => {
    console.log("🔍 useSmartAccountNFTs Query State:", {
      smartAccountAddress,
      normalizedAddress,
      loading,
      error: error?.message,
      hasData: !!nftData,
      dataKeys: nftData ? Object.keys(nftData) : [],
      skip: !normalizedAddress,
      queryVariables: { owner: normalizedAddress },
    });
  }, [smartAccountAddress, normalizedAddress, loading, error, nftData]);

  // Debug query: Get ALL transfers to see what's in Envio
  const { data: allTransfersData } = useQuery<NFTQueryResponse>(GET_ALL_NFT_TRANSFERS, {
    fetchPolicy: "network-only",
  });

  // Debug: Log all transfers
  useEffect(() => {
    if (allTransfersData?.FoodNFT_Transfer) {
      console.log("🔍 ALL NFT Transfers in Envio:", {
        total: allTransfersData.FoodNFT_Transfer.length,
        transfers: allTransfersData.FoodNFT_Transfer.map((t: NFTTransfer) => ({
          id: t.id,
          from: t.from,
          to: t.to,
          tokenId: t.tokenId,
          matchesOurSmartAccount: t.to.toLowerCase() === normalizedAddress,
        })),
      });
    }
  }, [allTransfersData, normalizedAddress]);

  // Debug: Log contract NFT data as fallback
  useEffect(() => {
    console.log("🔍 Contract NFT Data (Fallback):", {
      smartAccountAddress,
      contractNFTs,
      isArray: Array.isArray(contractNFTs),
      length: contractNFTs?.length,
      nfts: contractNFTs?.map((id: bigint) => id.toString()),
    });
  }, [contractNFTs, smartAccountAddress]);

  // Real-time subscription untuk instant updates
  const { data: subscriptionData } = useSubscription<NFTSubscriptionResponse>(NFT_TRANSFER_SUBSCRIPTION);

  // Update dari query data
  useEffect(() => {
    if (nftData?.FoodNFT_Transfer) {
      const transfers = nftData.FoodNFT_Transfer;
      // Filter by chain ID (event IDs formatted as {chainId}_{block}_{logIndex})
      const filtered = transfers.filter(t => t.id.startsWith(`${chainId}_`));
      setNftTransfers(filtered);
      console.log("📊 NFT Transfers from Envio Query:", {
        smartAccountAddress,
        total: transfers.length,
        filtered: filtered.length,
        chainId,
        rawTransfers: transfers.map(t => ({
          id: t.id,
          from: t.from,
          to: t.to,
          tokenId: t.tokenId,
          matchesChain: t.id.startsWith(`${chainId}_`),
        })),
      });
    }
  }, [nftData, chainId, smartAccountAddress]);

  // Update dari subscription (real-time)
  useEffect(() => {
    if (subscriptionData?.FoodNFT_Transfer && smartAccountAddress) {
      const transfers = subscriptionData.FoodNFT_Transfer;
      // Filter transfers yang ke smart account kita
      const relevantTransfers = transfers.filter(
        t => t.to.toLowerCase() === smartAccountAddress.toLowerCase() && t.id.startsWith(`${chainId}_`),
      );

      if (relevantTransfers.length > 0) {
        console.log("🔔 Real-time NFT Transfer detected:", relevantTransfers);
        // Trigger refetch untuk update data
        refetch();
      }
    }
  }, [subscriptionData, smartAccountAddress, chainId, refetch]);

  // Calculate owned NFTs (handle transfers out)
  const ownedNFTs = useMemo(() => {
    if (!smartAccountAddress) return [];

    console.log("📊 NFT Ownership Calculation:", {
      smartAccountAddress,
      nftTransfersCount: nftTransfers.length,
      hasContractNFTs: !!(contractNFTs && Array.isArray(contractNFTs) && contractNFTs.length > 0),
      contractNFTsCount: contractNFTs?.length || 0,
    });

    // FALLBACK: If Envio has no transfers but contract shows NFTs, use contract data
    if (nftTransfers.length === 0 && contractNFTs && Array.isArray(contractNFTs) && contractNFTs.length > 0) {
      console.log("✅ Using contract NFT data as fallback (Envio has no transfers):", {
        contractNFTs: contractNFTs.map((id: bigint) => id.toString()),
        source: "FoodNFT.getMyNFTs()",
      });
      return contractNFTs as bigint[];
    }

    // Build NFT ownership map - track latest owner for each tokenId
    const nftOwnership = new Map<string, { owner: string; timestamp: string }>();

    // Process all transfers in chronological order (asc) to build ownership history
    // Transfers are already sorted by db_write_timestamp asc from query
    nftTransfers.forEach(transfer => {
      const tokenId = transfer.tokenId;
      const currentOwner = nftOwnership.get(tokenId);

      // Update to latest owner based on timestamp
      if (!currentOwner || transfer.db_write_timestamp >= currentOwner.timestamp) {
        nftOwnership.set(tokenId, {
          owner: transfer.to.toLowerCase(),
          timestamp: transfer.db_write_timestamp,
        });
      }
    });

    // Filter NFTs currently owned by smart account
    const owned: bigint[] = [];
    nftOwnership.forEach((ownership, tokenId) => {
      if (ownership.owner === smartAccountAddress.toLowerCase()) {
        owned.push(BigInt(tokenId));
      }
    });

    console.log("📊 Owned NFTs calculated:", {
      smartAccountAddress,
      totalTransfers: nftTransfers.length,
      uniqueTokenIds: nftOwnership.size,
      ownedCount: owned.length,
      tokenIds: owned.map(id => id.toString()),
      ownershipMap: Array.from(nftOwnership.entries()).map(([tokenId, data]) => ({
        tokenId,
        currentOwner: data.owner,
        isOurs: data.owner === smartAccountAddress.toLowerCase(),
      })),
    });

    return owned;
  }, [nftTransfers, smartAccountAddress, contractNFTs]);

  return {
    // NFT data
    nftTransfers,
    ownedNFTs,
    nftCount: ownedNFTs.length,

    // Latest minted NFT (highest tokenId)
    latestNFT: ownedNFTs.length > 0 ? ownedNFTs[ownedNFTs.length - 1] : null,

    // Loading states
    loading,
    error,

    // Actions
    refetch: async () => {
      // Refetch both Envio and contract data
      const envioResult = await refetch();
      await refetchContractNFTs();
      return envioResult;
    },
  };
};
