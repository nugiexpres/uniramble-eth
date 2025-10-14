import { useEffect, useState } from "react";
import {
  ALL_PURCHASES_SUBSCRIPTION,
  FAUCET_USED_SUBSCRIPTION,
  GET_ALL_FAUCET_EVENTS,
  GET_ALL_FAUCET_USED_EVENTS,
  GET_ALL_HAMBURGER_MINTS,
  GET_ALL_INGREDIENT_PURCHASES,
  GET_ALL_RAIL_EVENTS,
  GET_ALL_SPECIAL_BOX_MINTS,
  GET_ALL_TBA_CREATIONS,
  GET_INGREDIENT_PURCHASES,
  GET_SPECIAL_BOX_MINTS,
  GET_TBAS_BY_EOA,
  HAMBURGER_MINTED_SUBSCRIPTION,
  RAIL_TRAVELED_SUBSCRIPTION,
} from "./queries";
import { useEnvioClient } from "./useEnvioClient";
import { useQuery, useSubscription } from "@apollo/client/react";

/**
 * Filter events by chain ID (event IDs are formatted as {chainId}_{block}_{logIndex})
 */
const filterByChain = <T extends { id: string }>(events: T[], chainId: number): T[] => {
  const prefix = `${chainId}_`;
  return events.filter(event => event.id.startsWith(prefix));
};

interface IngredientPurchase {
  id: string;
  player: string;
  ingredientType: number;
  position?: number; // Optional untuk backward compatibility
  db_write_timestamp: string;
}

interface SpecialBoxMint {
  id: string;
  user: string;
  hamburgerCount: number;
  db_write_timestamp: string;
}

interface FaucetEvent {
  id: string;
  owner: string;
  amount: number;
  db_write_timestamp: string;
}

interface FaucetUsedEvent {
  id: string;
  recipient: string;
  amount: number;
  db_write_timestamp: string;
}

interface RailTravelEvent {
  id: string;
  player: string;
  fromPosition: number;
  toPosition: number;
  db_write_timestamp: string;
}

interface HamburgerMintEvent {
  id: string;
  player: string;
  tokenId: number;
  db_write_timestamp: string;
}

interface TBACreation {
  id: string;
  eoa: string;
  tba: string;
  startPosition: number;
  db_write_timestamp: string;
}

interface GameEventsState {
  ingredientPurchases: IngredientPurchase[];
  specialBoxMints: SpecialBoxMint[];
  faucetEvents: FaucetEvent[];
  faucetUsedEvents: FaucetUsedEvent[];
  railTravelEvents: RailTravelEvent[];
  hamburgerMintEvents: HamburgerMintEvent[];
  tbaCreations: TBACreation[];
  totalPurchases: number;
  totalMints: number;
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook untuk mendapatkan game events dari Envio indexer
 * Menggantikan multiple contract calls dengan single GraphQL query
 */
export const useGameEvents = (playerAddress?: string): GameEventsState => {
  const { chainId } = useEnvioClient();
  const [ingredientPurchases, setIngredientPurchases] = useState<IngredientPurchase[]>([]);
  const [specialBoxMints, setSpecialBoxMints] = useState<SpecialBoxMint[]>([]);
  const [faucetEvents, setFaucetEvents] = useState<FaucetEvent[]>([]);
  const [faucetUsedEvents, setFaucetUsedEvents] = useState<FaucetUsedEvent[]>([]);
  const [railTravelEvents, setRailTravelEvents] = useState<RailTravelEvent[]>([]);
  const [hamburgerMintEvents, setHamburgerMintEvents] = useState<HamburgerMintEvent[]>([]);
  const [tbaCreations, setTbaCreations] = useState<TBACreation[]>([]);

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery(playerAddress ? GET_INGREDIENT_PURCHASES : GET_ALL_INGREDIENT_PURCHASES, {
    variables: playerAddress ? { player: playerAddress } : {},
    skip: false,
    pollInterval: 30000, // 30 seconds (subscriptions handle real-time updates)
    fetchPolicy: "cache-and-network",
  });

  const {
    data: mintsData,
    loading: mintsLoading,
    error: mintsError,
    refetch: refetchMints,
  } = useQuery(playerAddress ? GET_SPECIAL_BOX_MINTS : GET_ALL_SPECIAL_BOX_MINTS, {
    variables: playerAddress ? { user: playerAddress } : {},
    skip: false,
    pollInterval: 30000, // 30 seconds (less critical)
    fetchPolicy: "cache-and-network",
  });

  // Query faucet events
  const {
    data: faucetData,
    loading: faucetLoading,
    error: faucetError,
    refetch: refetchFaucet,
  } = useQuery(GET_ALL_FAUCET_EVENTS, {
    pollInterval: 10000, // 10 seconds polling (static data)
    fetchPolicy: "cache-and-network",
  });

  // Query TBA creation events
  const {
    data: tbaData,
    loading: tbaLoading,
    error: tbaError,
    refetch: refetchTBA,
  } = useQuery(GET_ALL_TBA_CREATIONS, {
    pollInterval: 10000, // 10 seconds polling (one-time events)
    fetchPolicy: "cache-and-network",
  });

  // Query faucet used events (actual user faucet usage)
  const {
    data: faucetUsedData,
    loading: faucetUsedLoading,
    error: faucetUsedError,
    refetch: refetchFaucetUsed,
  } = useQuery(GET_ALL_FAUCET_USED_EVENTS, {
    pollInterval: 30000, // 30 seconds (subscriptions handle real-time)
    fetchPolicy: "cache-and-network",
  });

  // Query rail travel events
  const {
    data: railTravelData,
    loading: railTravelLoading,
    error: railTravelError,
    refetch: refetchRailTravel,
  } = useQuery(GET_ALL_RAIL_EVENTS, {
    pollInterval: 30000, // 30 seconds (subscriptions handle real-time)
    fetchPolicy: "cache-and-network",
  });

  // Query hamburger mint events
  const {
    data: hamburgerMintData,
    loading: hamburgerMintLoading,
    error: hamburgerMintError,
    refetch: refetchHamburgerMint,
  } = useQuery(GET_ALL_HAMBURGER_MINTS, {
    pollInterval: 30000, // 30 seconds (subscriptions handle real-time)
    fetchPolicy: "cache-and-network",
  });

  // Real-time subscriptions untuk instant updates (WebSocket push, no polling!)
  const { data: purchaseSubscriptionData } = useSubscription(ALL_PURCHASES_SUBSCRIPTION);
  const { data: railSubscriptionData } = useSubscription(RAIL_TRAVELED_SUBSCRIPTION);
  const { data: hamburgerSubscriptionData } = useSubscription(HAMBURGER_MINTED_SUBSCRIPTION);
  const { data: faucetSubscriptionData } = useSubscription(FAUCET_USED_SUBSCRIPTION);

  // Handle real-time subscription updates for purchases
  useEffect(() => {
    if ((purchaseSubscriptionData as any)?.FoodScramble_IngredientPurchased) {
      const filtered = filterByChain(
        (purchaseSubscriptionData as any).FoodScramble_IngredientPurchased as IngredientPurchase[],
        chainId,
      );
      setIngredientPurchases(filtered);
    }
  }, [purchaseSubscriptionData, chainId]);

  // Handle real-time subscription updates for rail travel
  useEffect(() => {
    if ((railSubscriptionData as any)?.FoodScramble_RailTraveled) {
      const filtered = filterByChain(
        (railSubscriptionData as any).FoodScramble_RailTraveled as RailTravelEvent[],
        chainId,
      );
      setRailTravelEvents(filtered);
    }
  }, [railSubscriptionData, chainId]);

  // Handle real-time subscription updates for hamburger mints
  useEffect(() => {
    if ((hamburgerSubscriptionData as any)?.FoodScramble_HamburgerMinted) {
      const filtered = filterByChain(
        (hamburgerSubscriptionData as any).FoodScramble_HamburgerMinted as HamburgerMintEvent[],
        chainId,
      );
      setHamburgerMintEvents(filtered);
    }
  }, [hamburgerSubscriptionData, chainId]);

  // Handle real-time subscription updates for faucet usage
  useEffect(() => {
    if ((faucetSubscriptionData as any)?.FaucetMon_FaucetUsed) {
      const filtered = filterByChain(
        (faucetSubscriptionData as any).FaucetMon_FaucetUsed as FaucetUsedEvent[],
        chainId,
      );
      setFaucetUsedEvents(filtered);
    }
  }, [faucetSubscriptionData, chainId]);

  // Update ingredient purchases (filtered by chain)
  useEffect(() => {
    if ((purchasesData as any)?.FoodScramble_IngredientPurchased) {
      const raw = (purchasesData as any).FoodScramble_IngredientPurchased;
      console.log("🛒 Purchase Query Data:", { raw: raw.length, chainId });
      const filtered = filterByChain(raw as IngredientPurchase[], chainId);
      console.log("🛒 After chain filter:", filtered.length);
      setIngredientPurchases(filtered);
    }
  }, [purchasesData, chainId]);

  // Update special box mints (filtered by chain)
  useEffect(() => {
    if ((mintsData as any)?.FoodScramble_SpecialBoxMinted) {
      const filtered = filterByChain((mintsData as any).FoodScramble_SpecialBoxMinted as SpecialBoxMint[], chainId);
      setSpecialBoxMints(filtered);
    }
  }, [mintsData, chainId]);

  // Update faucet events (filtered by chain)
  useEffect(() => {
    if ((faucetData as any)?.FaucetMon_BalanceWithdrawn) {
      const filtered = filterByChain((faucetData as any).FaucetMon_BalanceWithdrawn as FaucetEvent[], chainId);
      setFaucetEvents(filtered);
    }
  }, [faucetData, chainId]);

  // Update TBA creation events (filtered by chain)
  useEffect(() => {
    if ((tbaData as any)?.FoodScramble_TokenBoundAccountCreated) {
      const filtered = filterByChain((tbaData as any).FoodScramble_TokenBoundAccountCreated as TBACreation[], chainId);
      setTbaCreations(filtered);
    }
  }, [tbaData, chainId]);

  // Update faucet used events (filtered by chain)
  useEffect(() => {
    if ((faucetUsedData as any)?.FaucetMon_FaucetUsed) {
      const filtered = filterByChain((faucetUsedData as any).FaucetMon_FaucetUsed as FaucetUsedEvent[], chainId);
      setFaucetUsedEvents(filtered);
    }
  }, [faucetUsedData, chainId]);

  // Update rail travel events (filtered by chain)
  useEffect(() => {
    if ((railTravelData as any)?.FoodScramble_RailTraveled) {
      const filtered = filterByChain((railTravelData as any).FoodScramble_RailTraveled as RailTravelEvent[], chainId);
      setRailTravelEvents(filtered);
    }
  }, [railTravelData, chainId]);

  // Update hamburger mint events (filtered by chain)
  useEffect(() => {
    if ((hamburgerMintData as any)?.FoodScramble_HamburgerMinted) {
      const filtered = filterByChain(
        (hamburgerMintData as any).FoodScramble_HamburgerMinted as HamburgerMintEvent[],
        chainId,
      );
      setHamburgerMintEvents(filtered);
    }
  }, [hamburgerMintData, chainId]);

  const refetch = () => {
    refetchPurchases();
    refetchMints();
    refetchFaucet();
    refetchFaucetUsed();
    refetchRailTravel();
    refetchHamburgerMint();
    refetchTBA();
  };

  return {
    ingredientPurchases,
    specialBoxMints,
    faucetEvents,
    faucetUsedEvents,
    railTravelEvents,
    hamburgerMintEvents,
    tbaCreations,
    totalPurchases: ingredientPurchases.length,
    totalMints: specialBoxMints.length,
    loading:
      purchasesLoading ||
      mintsLoading ||
      faucetLoading ||
      faucetUsedLoading ||
      railTravelLoading ||
      hamburgerMintLoading ||
      tbaLoading,
    error:
      purchasesError ||
      mintsError ||
      faucetError ||
      faucetUsedError ||
      railTravelError ||
      hamburgerMintError ||
      tbaError,
    refetch,
  };
};

/**
 * Hook untuk mendapatkan TBA data dari EOA
 */
export const useSmartAccountTBA = (eoaAddress?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_TBAS_BY_EOA, {
    variables: { eoa: eoaAddress },
    skip: !eoaAddress,
    pollInterval: 60000, // 60s (TBA creation is one-time event, rarely changes)
    fetchPolicy: "cache-and-network",
  });

  const tbaData = (data as any)?.FoodScramble_TokenBoundAccountCreated || [];
  const latestTBA = tbaData[0];

  return {
    tbaData,
    latestTBA,
    loading,
    error,
    refetch,
  };
};
