import { useEffect, useMemo, useState } from "react";
import {
  GAME_ACTIONS_SUBSCRIPTION,
  GET_ALL_GAME_ACTIONS,
  GET_BUY_ACTIONS,
  GET_COOK_ACTIONS,
  GET_FAUCET_ACTIONS,
  GET_GAME_ACTIONS_BY_PLAYER,
  GET_GAME_ACTIONS_BY_TBA,
  GET_GAME_ACTIONS_BY_TYPE,
  GET_RAIL_ACTIONS,
  GET_ROLL_ACTIONS,
  PLAYER_GAME_ACTIONS_SUBSCRIPTION,
} from "./envioGameActionsQueries";
import { useQuery, useSubscription } from "@apollo/client/react";

export interface EnvioGameAction {
  id: string;
  player: string;
  tbaAddress: string;
  actionType: "roll" | "rail" | "buy" | "faucet" | "cook" | "mint";
  actionData: string; // JSON string
  position: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  db_write_timestamp: string;
}

export interface EnvioGameActionsState {
  allActions: EnvioGameAction[];
  playerActions: EnvioGameAction[];
  tbaActions: EnvioGameAction[];
  rollActions: EnvioGameAction[];
  buyActions: EnvioGameAction[];
  cookActions: EnvioGameAction[];
  faucetActions: EnvioGameAction[];
  railActions: EnvioGameAction[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook utama untuk mendapatkan semua game actions dari Envio indexer
 * Menggantikan multiple contract calls dengan single GraphQL queries
 */
export const useEnvioGameActions = (playerAddress?: string, tbaAddress?: string): EnvioGameActionsState => {
  const [allActions, setAllActions] = useState<EnvioGameAction[]>([]);
  const [playerActions, setPlayerActions] = useState<EnvioGameAction[]>([]);
  const [tbaActions, setTbaActions] = useState<EnvioGameAction[]>([]);
  const [rollActions, setRollActions] = useState<EnvioGameAction[]>([]);
  const [buyActions, setBuyActions] = useState<EnvioGameAction[]>([]);
  const [cookActions, setCookActions] = useState<EnvioGameAction[]>([]);
  const [faucetActions, setFaucetActions] = useState<EnvioGameAction[]>([]);
  const [railActions, setRailActions] = useState<EnvioGameAction[]>([]);

  // Query semua game actions
  const {
    data: allActionsData,
    loading: allActionsLoading,
    error: allActionsError,
    refetch: refetchAllActions,
  } = useQuery(GET_ALL_GAME_ACTIONS, {
    variables: { limit: 100 },
    pollInterval: 1000, // Poll setiap 1 detik untuk real-time updates
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Query actions by player (jika ada playerAddress)
  const {
    data: playerActionsData,
    loading: playerActionsLoading,
    error: playerActionsError,
    refetch: refetchPlayerActions,
  } = useQuery(GET_GAME_ACTIONS_BY_PLAYER, {
    variables: { player: playerAddress, limit: 50 },
    skip: !playerAddress,
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  // Query actions by TBA (jika ada tbaAddress)
  const {
    data: tbaActionsData,
    loading: tbaActionsLoading,
    error: tbaActionsError,
    refetch: refetchTbaActions,
  } = useQuery(GET_GAME_ACTIONS_BY_TBA, {
    variables: { tbaAddress: tbaAddress, limit: 50 },
    skip: !tbaAddress,
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  // Query actions by type untuk analytics
  const {
    data: rollActionsData,
    loading: rollActionsLoading,
    error: rollActionsError,
    refetch: refetchRollActions,
  } = useQuery(GET_ROLL_ACTIONS, {
    variables: { limit: 20 },
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: buyActionsData,
    loading: buyActionsLoading,
    error: buyActionsError,
    refetch: refetchBuyActions,
  } = useQuery(GET_BUY_ACTIONS, {
    variables: { limit: 20 },
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: cookActionsData,
    loading: cookActionsLoading,
    error: cookActionsError,
    refetch: refetchCookActions,
  } = useQuery(GET_COOK_ACTIONS, {
    variables: { limit: 20 },
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: faucetActionsData,
    loading: faucetActionsLoading,
    error: faucetActionsError,
    refetch: refetchFaucetActions,
  } = useQuery(GET_FAUCET_ACTIONS, {
    variables: { limit: 20 },
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  const {
    data: railActionsData,
    loading: railActionsLoading,
    error: railActionsError,
    refetch: refetchRailActions,
  } = useQuery(GET_RAIL_ACTIONS, {
    variables: { limit: 20 },
    pollInterval: 1000,
    fetchPolicy: "cache-and-network",
  });

  // Real-time subscriptions
  const { data: subscriptionData } = useSubscription(GAME_ACTIONS_SUBSCRIPTION);
  const { data: playerSubscriptionData } = useSubscription(PLAYER_GAME_ACTIONS_SUBSCRIPTION, {
    variables: { player: playerAddress },
    skip: !playerAddress,
  });

  // Update states from query data
  useEffect(() => {
    if ((allActionsData as any)?.GameAction) {
      setAllActions((allActionsData as any).GameAction);
    }
  }, [allActionsData]);

  useEffect(() => {
    if ((playerActionsData as any)?.GameAction) {
      setPlayerActions((playerActionsData as any).GameAction);
    }
  }, [playerActionsData]);

  useEffect(() => {
    if ((tbaActionsData as any)?.GameAction) {
      setTbaActions((tbaActionsData as any).GameAction);
    }
  }, [tbaActionsData]);

  useEffect(() => {
    if ((rollActionsData as any)?.GameAction) {
      setRollActions((rollActionsData as any).GameAction);
    }
  }, [rollActionsData]);

  useEffect(() => {
    if ((buyActionsData as any)?.GameAction) {
      setBuyActions((buyActionsData as any).GameAction);
    }
  }, [buyActionsData]);

  useEffect(() => {
    if ((cookActionsData as any)?.GameAction) {
      setCookActions((cookActionsData as any).GameAction);
    }
  }, [cookActionsData]);

  useEffect(() => {
    if ((faucetActionsData as any)?.GameAction) {
      setFaucetActions((faucetActionsData as any).GameAction);
    }
  }, [faucetActionsData]);

  useEffect(() => {
    if ((railActionsData as any)?.GameAction) {
      setRailActions((railActionsData as any).GameAction);
    }
  }, [railActionsData]);

  // Update dari subscription data (real-time)
  useEffect(() => {
    if ((subscriptionData as any)?.GameAction) {
      setAllActions(prev => [...(subscriptionData as any).GameAction, ...prev].slice(0, 100));
    }
  }, [subscriptionData]);

  useEffect(() => {
    if ((playerSubscriptionData as any)?.GameAction) {
      setPlayerActions(prev => [...(playerSubscriptionData as any).GameAction, ...prev].slice(0, 50));
    }
  }, [playerSubscriptionData]);

  const refetch = () => {
    refetchAllActions();
    refetchPlayerActions();
    refetchTbaActions();
    refetchRollActions();
    refetchBuyActions();
    refetchCookActions();
    refetchFaucetActions();
    refetchRailActions();
  };

  const loading =
    allActionsLoading ||
    playerActionsLoading ||
    tbaActionsLoading ||
    rollActionsLoading ||
    buyActionsLoading ||
    cookActionsLoading ||
    faucetActionsLoading ||
    railActionsLoading;

  const error =
    allActionsError ||
    playerActionsError ||
    tbaActionsError ||
    rollActionsError ||
    buyActionsError ||
    cookActionsError ||
    faucetActionsError ||
    railActionsError;

  return {
    allActions,
    playerActions,
    tbaActions,
    rollActions,
    buyActions,
    cookActions,
    faucetActions,
    railActions,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook khusus untuk player stats dengan real-time updates
 */
export const useEnvioPlayerStats = (playerAddress?: string, tbaAddress?: string) => {
  // Import queries dari file terpisah
  const {
    GET_PLAYER_STATS_BY_PLAYER,
    GET_PLAYER_STATS_BY_TBA,
    PLAYER_STATS_SUBSCRIPTION,
  } = require("./envioGameActionsQueries");

  const [playerStats, setPlayerStats] = useState<any>(null);
  const [tbaStats, setTbaStats] = useState<any>(null);

  const {
    data: playerStatsData,
    loading: playerStatsLoading,
    error: playerStatsError,
    refetch: refetchPlayerStats,
  } = useQuery(GET_PLAYER_STATS_BY_PLAYER, {
    variables: { player: playerAddress },
    skip: !playerAddress,
    pollInterval: 2000, // Poll setiap 2 detik untuk stats
    fetchPolicy: "cache-and-network",
  });

  const {
    data: tbaStatsData,
    loading: tbaStatsLoading,
    error: tbaStatsError,
    refetch: refetchTbaStats,
  } = useQuery(GET_PLAYER_STATS_BY_TBA, {
    variables: { tbaAddress: tbaAddress },
    skip: !tbaAddress,
    pollInterval: 2000,
    fetchPolicy: "cache-and-network",
  });

  // Real-time subscription untuk player stats
  const { data: statsSubscriptionData } = useSubscription(PLAYER_STATS_SUBSCRIPTION);

  useEffect(() => {
    if ((playerStatsData as any)?.PlayerStats?.[0]) {
      setPlayerStats((playerStatsData as any).PlayerStats[0]);
    }
  }, [playerStatsData]);

  useEffect(() => {
    if ((tbaStatsData as any)?.PlayerStats?.[0]) {
      setTbaStats((tbaStatsData as any).PlayerStats[0]);
    }
  }, [tbaStatsData]);

  useEffect(() => {
    if ((statsSubscriptionData as any)?.PlayerStats) {
      const stats = (statsSubscriptionData as any).PlayerStats.find(
        (stat: any) => stat.player === playerAddress || stat.tbaAddress === tbaAddress,
      );
      if (stats) {
        if (stats.player === playerAddress) setPlayerStats(stats);
        if (stats.tbaAddress === tbaAddress) setTbaStats(stats);
      }
    }
  }, [statsSubscriptionData, playerAddress, tbaAddress]);

  const refetch = () => {
    refetchPlayerStats();
    refetchTbaStats();
  };

  return {
    playerStats,
    tbaStats,
    loading: playerStatsLoading || tbaStatsLoading,
    error: playerStatsError || tbaStatsError,
    refetch,
  };
};
