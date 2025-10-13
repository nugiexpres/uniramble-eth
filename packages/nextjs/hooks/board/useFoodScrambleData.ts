import { useAccount } from "wagmi";
import { useGameEvents } from "~~/hooks/envio/useGameEvents";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";
import { useSmartAccountTBA } from "~~/hooks/envio/useSmartAccountTBA";
import { useScaffoldReadContract, useScaffoldWatchContractEvent } from "~~/hooks/scaffold-eth";

interface UseFoodScrambleDataProps {
  address?: string;
  enableWatch?: boolean;
}

export enum IngredientType {
  Bread = 0,
  Meat = 1,
  Lettuce = 2,
  Tomato = 3,
}

export interface Box {
  id: bigint;
  typeGrid: string;
  ingredientType: bigint;
  numberOfPlayers: bigint;
}

export interface PlayerStats {
  totalRolls: bigint;
  ingredientsCollected: bigint;
  foodsMinted: bigint;
  specialBoxCollected: bigint;
  lastActive: bigint;
  hasSpecialAccess: boolean;
}

// Re-export useActionBoard from the separate file
export { useActionBoard } from "./useActionBoard";

export const useFoodScrambleData = ({ address, enableWatch = true }: UseFoodScrambleDataProps = {}) => {
  const { address: connectedAddress } = useAccount();
  const userAddress = address || connectedAddress;

  // Get Smart Account TBA (priority over EOA)
  const { tbaAddress: smartAccountTbaAddress } = useSmartAccountTBA();

  // Use Smart Account TBA if available, otherwise fallback to EOA
  const effectiveUserAddress = smartAccountTbaAddress || userAddress;

  // Grid and Game Data

  // Get the game grid
  const { data: grid, refetch: refetchGrid } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getGrid",
    watch: enableWatch,
  });

  // Get user's TBA address (fallback if Smart Account TBA not available)
  const { data: contractUserTBA, refetch: refetchUserTBA } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "tbaList",
    args: [effectiveUserAddress],
    query: {
      enabled: !!effectiveUserAddress,
    },
    watch: enableWatch,
  });

  // Use Smart Account TBA if available, otherwise use contract TBA
  const userTBA = smartAccountTbaAddress || contractUserTBA;

  // Envio-powered data for faster access
  const { positions: envioPositions, latestPositions } = usePlayerPositions();
  const { ingredientPurchases, specialBoxMints, loading: envioLoading } = useGameEvents(userTBA);
  const envioPlayerPosition = envioPositions[effectiveUserAddress || ""];

  // Debug logging for TBA and player position
  console.log("useFoodScrambleData Debug:", {
    userAddress,
    userTBA,
    tbaExists: userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
  });

  // Get user's current position on grid
  const { data: playerPosition, refetch: refetchPlayerPosition } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "player",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Check if user can buy ingredient
  const { data: canBuy, refetch: refetchCanBuy } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "canBuy",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Get user's roll count
  const { data: rollCount, refetch: refetchRollCount } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "rollCount",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Get random roll result (for dice animation)
  const { data: randomRollResult, refetch: refetchRandomRoll } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getRandomRollForUI",
    args: [userTBA || "0x0000000000000000000000000000000000000000", rollCount || 0n],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000" && rollCount !== undefined,
    },
    watch: false, // Don't watch this, we'll refetch manually
  });

  // Get user's player stats
  const { data: playerStats, refetch: refetchPlayerStats } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "stats",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Check if account is ready (TBA exists) - use Smart Account address if available
  const { data: accountReady, refetch: refetchAccountReady } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "accountReady",
    args: [smartAccountTbaAddress || userAddress], // Use Smart Account TBA if available
    query: {
      enabled: !!(smartAccountTbaAddress || userAddress),
    },
    watch: enableWatch,
  });

  // CRITICAL: Check TBA registration with Smart Account address (for cook function)
  const { data: smartAccountTbaRegistration, refetch: refetchSmartAccountTbaRegistration } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "tbaList",
    args: [smartAccountTbaAddress || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!smartAccountTbaAddress,
    },
    watch: enableWatch,
  });

  // Check if player is created
  const { data: isPlayerCreated, refetch: refetchIsPlayerCreated } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "isPlayerCreated",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Get username
  const { data: username, refetch: refetchUsername } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "usernames",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
    watch: enableWatch,
  });

  // Food and Special Box Data

  // Get user's food NFTs
  const { data: myFoods, refetch: refetchMyFoods } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getMyFoods",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
    watch: enableWatch,
  });

  // Get user's NFTs (all NFTs owned by user)
  const {
    data: myNFTs,
    refetch: refetchMyNFTs,
    isLoading: myNFTsLoading,
  } = useScaffoldReadContract({
    contractName: "FoodNFT",
    functionName: "getMyNFTs",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
    watch: enableWatch,
  });

  // Get special box count (function may not exist in contract)
  // const { data: specialBoxCount, refetch: refetchSpecialBoxCount } = useScaffoldReadContract({
  //   contractName: "FoodScramble",
  //   functionName: "specialBoxCount",
  //   args: [userTBA],
  //   query: {
  //     enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
  //   },
  //   watch: enableWatch,
  // });
  const specialBoxCount = 0n; // Mock data for now

  // Get last minted special box timestamp
  const { data: lastMintedSpecialBox, refetch: refetchLastMintedSpecialBox } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "lastMintedSpecialBox",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Faucet Data

  // Get faucet usage count
  const { data: faucetUsageCount, refetch: refetchFaucetUsageCount } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "faucetUsageCount",
    args: [userTBA || "0x0000000000000000000000000000000000000000"],
    query: {
      enabled: !!userTBA && userTBA !== "0x0000000000000000000000000000000000000000",
    },
    watch: enableWatch,
  });

  // Get last faucet usage timestamp
  const { data: lastFaucetUsage, refetch: refetchLastFaucetUsage } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "lastFaucetUsage",
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
    watch: enableWatch,
  });

  // Fees and Config

  // Ingredient fee is now 0 (free) - no need to fetch from contract
  const ingredientFee = 0n;

  // Get box fee (function may not exist in contract)
  // const { data: boxFee, refetch: refetchBoxFee } = useScaffoldReadContract({
  //   contractName: "FoodScramble",
  //   functionName: "getBoxFee",
  //   watch: enableWatch,
  // });
  const boxFee = 0n; // Mock data for now

  // Get faucet amount
  const { data: faucetAmount, refetch: refetchFaucetAmount } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getFaucetAmount",
    watch: enableWatch,
  });

  // Get faucet cooldown
  const { data: faucetCooldown, refetch: refetchFaucetCooldown } = useScaffoldReadContract({
    contractName: "FoodScramble",
    functionName: "getFaucetCooldown",
    watch: enableWatch,
  });

  // EVENT WATCHING (Real-time events)
  // Note: useScaffoldEventHistory is deprecated, using useScaffoldWatchContractEvent for real-time events

  // Watch player movement events
  useScaffoldWatchContractEvent({
    contractName: "FoodScramble",
    eventName: "PlayerMoved",
    onLogs: logs => {
      console.log("PlayerMoved events:", logs);
    },
  });

  // Watch ingredient purchase events
  useScaffoldWatchContractEvent({
    contractName: "FoodScramble",
    eventName: "IngredientPurchased",
    onLogs: logs => {
      console.log("IngredientPurchased events:", logs);
    },
  });

  // Watch special box minted events
  // useScaffoldWatchContractEvent({
  //   contractName: "FoodScramble",
  //   eventName: "SpecialBoxMinted",
  //   onLogs: logs => {
  //     console.log("SpecialBoxMinted events:", logs);
  //   },
  // });

  // Watch player created events
  useScaffoldWatchContractEvent({
    contractName: "FoodScramble",
    eventName: "PlayerCreated",
    onLogs: logs => {
      console.log("PlayerCreated events:", logs);
    },
  });

  // Watch TBA created events
  useScaffoldWatchContractEvent({
    contractName: "FoodScramble",
    eventName: "TokenBoundAccountCreated",
    onLogs: logs => {
      console.log("TokenBoundAccountCreated events:", logs);
    },
  });

  // REFETCH ALL DATA
  const refetchAll = async () => {
    await Promise.all([
      // Game data
      refetchGrid(),
      refetchUserTBA(),
      refetchPlayerPosition(),
      refetchCanBuy(),
      refetchRollCount(),
      refetchPlayerStats(),
      refetchAccountReady(),
      refetchIsPlayerCreated(),
      refetchUsername(),
      // Food and special box data
      refetchMyFoods(),
      // refetchSpecialBoxCount(), // Commented out - function may not exist
      refetchLastMintedSpecialBox(),
      // Faucet data
      refetchFaucetUsageCount(),
      refetchLastFaucetUsage(),
      // Config data (ingredient fee is mocked locally)
      // refetchBoxFee(), // Commented out - function may not exist
      refetchFaucetAmount(),
      refetchFaucetCooldown(),
    ]);
  };

  // HELPER FUNCTIONS

  /**
   * Get current box info where player is located
   */
  const getCurrentBox = (): Box | null => {
    if (!grid || playerPosition === undefined) return null;
    return grid[Number(playerPosition)] || null;
  };

  /**
   * Check if player can buy ingredient at current position
   */
  const canBuyAtCurrentPosition = (): boolean => {
    const currentBox = getCurrentBox();
    return currentBox ? Number(currentBox.ingredientType) <= 3 : false;
  };

  /**
   * Get ingredient type at current position
   */
  const getCurrentIngredientType = (): IngredientType | null => {
    const currentBox = getCurrentBox();
    if (!currentBox || Number(currentBox.ingredientType) > 3) return null;
    return Number(currentBox.ingredientType) as IngredientType;
  };

  /**
   * Check if player can mint special box
   */
  const canMintSpecialBox = (): boolean => {
    const foodCount = myFoods ? myFoods.length : 0;
    if (foodCount < 10) return false;

    const currentRangeStart = Math.floor(foodCount / 10) * 10;
    const lastMinted = Number(lastMintedSpecialBox || 0n);
    return lastMinted < currentRangeStart;
  };

  /**
   * Get special box mint requirements info
   */
  const getSpecialBoxMintInfo = () => {
    const foodCount = myFoods ? myFoods.length : 0;
    const currentRangeStart = Math.floor(foodCount / 10) * 10;
    const nextRangeStart = currentRangeStart + 10;
    const lastMinted = Number(lastMintedSpecialBox || 0n);

    return {
      currentFoodCount: foodCount,
      requiredFoodCount: 10,
      canMint: canMintSpecialBox(),
      currentRangeStart,
      nextRangeStart,
      foodsNeededForNextBox: nextRangeStart - foodCount,
      lastMintedAt: lastMinted,
    };
  };

  /**
   * Check if player can use faucet
   */
  const canUseFaucet = (): boolean => {
    const currentBox = getCurrentBox();
    if (!currentBox || currentBox.typeGrid !== "Stove") return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const lastUsage = Number(lastFaucetUsage || 0n);
    const cooldown = Number(faucetCooldown || 0n);

    return currentTime >= lastUsage + cooldown;
  };

  /**
   * Get faucet cooldown remaining time
   */
  const getFaucetCooldownRemaining = (): number => {
    const currentTime = Math.floor(Date.now() / 1000);
    const lastUsage = Number(lastFaucetUsage || 0n);
    const cooldown = Number(faucetCooldown || 0n);
    const remaining = lastUsage + cooldown - currentTime;
    return remaining > 0 ? remaining : 0;
  };

  /**
   * Format cooldown time to human readable format
   */
  const formatCooldownTime = (seconds: number): string => {
    if (seconds <= 0) return "Ready";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  /**
   * Get ingredient name by type
   */
  const getIngredientName = (type: IngredientType): string => {
    const names = {
      [IngredientType.Bread]: "Bread",
      [IngredientType.Meat]: "Meat",
      [IngredientType.Lettuce]: "Lettuce",
      [IngredientType.Tomato]: "Tomato",
    };
    return names[type] || "Unknown";
  };

  return {
    // User Data
    userAddress,
    userTBA,
    accountReady: accountReady || false,
    isPlayerCreated: isPlayerCreated || false,
    username: username || "",

    // Game State
    grid: (grid as Box[]) || [],
    playerPosition: Number(playerPosition || 0n),
    canBuy: canBuy || false,
    rollCount: Number(rollCount || 0n),
    randomRollResult: Number(randomRollResult || 0n),
    playerStats: playerStats,

    // Food and Special Box Data
    myFoods: myFoods || [],
    myNFTs: myNFTs || [],
    myNFTsLoading,
    specialBoxCount: Number(specialBoxCount || 0n),
    lastMintedSpecialBox: Number(lastMintedSpecialBox || 0n),

    // Faucet Data
    faucetUsageCount: Number(faucetUsageCount || 0n),
    lastFaucetUsage: Number(lastFaucetUsage || 0n),

    // Config Data
    ingredientFee: ingredientFee || 0n,
    boxFee: boxFee || 0n,
    faucetAmount: faucetAmount || 0n,
    faucetCooldown: Number(faucetCooldown || 0n),

    // Event History (deprecated - using real-time watching instead)
    // Note: Historical event data is no longer available due to useScaffoldEventHistory deprecation

    // Helper Functions
    getCurrentBox,
    canBuyAtCurrentPosition,
    getCurrentIngredientType,
    canMintSpecialBox,
    getSpecialBoxMintInfo,
    canUseFaucet,
    getFaucetCooldownRemaining,
    formatCooldownTime,
    getIngredientName,

    // Utility Functions
    refetchAll,
    refetchGrid,
    refetchUserTBA,
    refetchPlayerPosition,
    refetchCanBuy,
    refetchRollCount,
    refetchRandomRoll,
    refetchPlayerStats,
    refetchMyFoods,
    refetchMyNFTs,
    // refetchSpecialBoxCount, // Commented out - function may not exist
    refetchLastMintedSpecialBox,
    refetchSmartAccountTbaRegistration,

    // Raw contract data (for advanced use)
    raw: {
      grid,
      userTBA,
      playerPosition,
      canBuy,
      rollCount,
      playerStats,
      accountReady,
      smartAccountTbaRegistration,
      isPlayerCreated,
      username,
      myFoods,
      myNFTs,
      specialBoxCount,
      lastMintedSpecialBox,
      faucetUsageCount,
      lastFaucetUsage,
      ingredientFee,
      boxFee,
      faucetAmount,
      faucetCooldown,
    },

    // Envio data (faster access)
    envio: {
      playerPosition: envioPlayerPosition,
      positions: envioPositions,
      latestPositions,
      ingredientPurchases,
      specialBoxMints,
      loading: envioLoading,
    },

    // Smart Account info
    smartAccount: {
      tbaAddress: smartAccountTbaAddress,
      effectiveAddress: effectiveUserAddress,
      usingSmartAccountTBA: !!smartAccountTbaAddress,
    },
  };
};
