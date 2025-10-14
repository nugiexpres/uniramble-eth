import { useCallback, useEffect, useState } from "react";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export const useGameData = (address: string | undefined) => {
  const [gridData, setGridData] = useState<
    { id: number; typeGrid: string; ingredientType: number; numberOfPlayers: number }[]
  >([]);
  const [isOnStove, setIsOnStove] = useState(false);

  // Get TBA address from Smart Account (priority over EOA)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise fallback to contract lookup
  const effectiveAddress = smartAccountTbaAddress || address;

  // TBA Address from contract (fallback)
  const { data: contractTbaAddress } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "tbaList",
    args: [effectiveAddress],
    query: {
      enabled: !!effectiveAddress,
    },
  });

  // Use Smart Account TBA if available, otherwise use contract TBA
  const tbaAddress = smartAccountTbaAddress || contractTbaAddress;

  // Envio-powered player positions for faster data
  const { positions: envioPositions, latestPositions } = usePlayerPositions();
  const envioPlayerPosition = envioPositions[effectiveAddress || ""];

  // Food NFTs data - use Smart Account TBA
  const { data: foodNftsData, refetch: refetchFoodNfts } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getMyFoods",
    args: [tbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!tbaAddress,
      refetchInterval: 60000, // 60s - Token + Envio subscriptions for cook events
    },
    watch: false, // Disable continuous polling
  });

  // Grid data from contract
  const { data: gridDataFromContract } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getGrid",
  });

  // Utility variables
  const safeFoodNfts = Array.isArray(foodNftsData) ? foodNftsData : [];

  // Update grid data when contract data changes
  useEffect(() => {
    if (gridDataFromContract) {
      // Convert bigint to number for UI compatibility
      const convertedGridData = gridDataFromContract.map((item: any) => ({
        id: Number(item.id),
        typeGrid: item.typeGrid,
        ingredientType: Number(item.ingredientType),
        numberOfPlayers: Number(item.numberOfPlayers),
      }));
      setGridData(convertedGridData);
    }
  }, [gridDataFromContract]);

  // Update stove status based on player position
  const updateStoveStatus = useCallback(
    (playerPositionData: any) => {
      if (gridData && playerPositionData !== undefined) {
        const playerPos = Number(playerPositionData?.toString());
        const onStove = gridData[playerPos]?.typeGrid === "Stove";
        setIsOnStove(onStove);
      }
    },
    [gridData],
  );

  // Refetch function for safe food NFTs
  const refetchSafeFoodNfts = async () => {
    try {
      console.log("🔄 Refetching food NFTs data...");
      if (refetchFoodNfts) {
        await refetchFoodNfts();
        console.log("✅ Food NFTs data refetched successfully");
      }
    } catch (error) {
      console.error("❌ Failed to refetch food NFTs:", error);
      throw error;
    }
  };

  // Debug logging
  console.log("=== useGameData Smart Account Debug ===");
  console.log("Input Address:", address);
  console.log("Smart Account TBA:", smartAccountTbaAddress);
  console.log("Effective Address:", effectiveAddress);
  console.log("Final TBA Address:", tbaAddress);
  console.log("Envio Player Position:", envioPlayerPosition);
  console.log("=====================================");

  return {
    tbaAddress,
    gridData,
    foodNftsData,
    safeFoodNfts,
    isOnStove,
    updateStoveStatus,
    refetchSafeFoodNfts,
    // Envio data
    envioPlayerPosition,
    envioPositions,
    latestPositions,
    // Smart Account info
    smartAccountTbaAddress,
    effectiveAddress,
  };
};
