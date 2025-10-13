import { useEffect, useState } from "react";
import {
  GET_ALL_FAUCET_EVENTS,
  GET_ALL_INGREDIENT_PURCHASES,
  GET_ALL_SPECIAL_BOX_MINTS,
  GET_ALL_TBA_CREATIONS,
  GET_INGREDIENT_PURCHASES,
  GET_SPECIAL_BOX_MINTS,
  GET_TBAS_BY_EOA,
  INGREDIENT_PURCHASE_SUBSCRIPTION,
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
  fee: number;
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
  const [tbaCreations, setTbaCreations] = useState<TBACreation[]>([]);

  const {
    data: purchasesData,
    loading: purchasesLoading,
    error: purchasesError,
    refetch: refetchPurchases,
  } = useQuery(playerAddress ? GET_INGREDIENT_PURCHASES : GET_ALL_INGREDIENT_PURCHASES, {
    variables: playerAddress ? { player: playerAddress } : {},
    skip: false, // Always run query
    pollInterval: 1000, // 1 second polling to avoid rate limiting
    fetchPolicy: "cache-and-network",
  });

  const {
    data: mintsData,
    loading: mintsLoading,
    error: mintsError,
    refetch: refetchMints,
  } = useQuery(playerAddress ? GET_SPECIAL_BOX_MINTS : GET_ALL_SPECIAL_BOX_MINTS, {
    variables: playerAddress ? { user: playerAddress } : {},
    skip: false, // Always run query
    pollInterval: 1000, // 1 second polling to avoid rate limiting
    fetchPolicy: "cache-and-network",
  });

  // Query faucet events
  const {
    data: faucetData,
    loading: faucetLoading,
    error: faucetError,
    refetch: refetchFaucet,
  } = useQuery(GET_ALL_FAUCET_EVENTS, {
    pollInterval: 2000, // 2 second polling (less frequent for non-critical data)
    fetchPolicy: "cache-and-network",
  });

  // Query TBA creation events
  const {
    data: tbaData,
    loading: tbaLoading,
    error: tbaError,
    refetch: refetchTBA,
  } = useQuery(GET_ALL_TBA_CREATIONS, {
    pollInterval: 2000, // 2 second polling (less frequent for non-critical data)
    fetchPolicy: "cache-and-network",
  });

  // Real-time subscription untuk ingredient purchases
  const { data: subscriptionData } = useSubscription(INGREDIENT_PURCHASE_SUBSCRIPTION, {
    variables: { player: playerAddress },
    skip: !playerAddress,
  });

  // Update ingredient purchases (filtered by chain)
  useEffect(() => {
    if ((purchasesData as any)?.FoodScramble_IngredientPurchased) {
      const filtered = filterByChain(
        (purchasesData as any).FoodScramble_IngredientPurchased as IngredientPurchase[],
        chainId,
      );
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

  // Update dari subscription (real-time)
  useEffect(() => {
    if ((subscriptionData as any)?.FoodScramble_IngredientPurchased) {
      setIngredientPurchases(prev => [...(subscriptionData as any).FoodScramble_IngredientPurchased, ...prev]);
    }
  }, [subscriptionData]);

  const refetch = () => {
    refetchPurchases();
    refetchMints();
    refetchFaucet();
    refetchTBA();
  };

  return {
    ingredientPurchases,
    specialBoxMints,
    faucetEvents,
    tbaCreations,
    totalPurchases: ingredientPurchases.length,
    totalMints: specialBoxMints.length,
    loading: purchasesLoading || mintsLoading || faucetLoading || tbaLoading,
    error: purchasesError || mintsError || faucetError || tbaError,
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
    pollInterval: 2000, // 2 second polling (TBA creation is one-time event)
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
