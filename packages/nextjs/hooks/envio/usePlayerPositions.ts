import { useEffect, useMemo, useState } from "react";
import { GET_PLAYER_POSITIONS, GET_PLAYER_POSITION_BY_ADDRESS, PLAYER_MOVEMENT_SUBSCRIPTION } from "./queries";
import { useEnvioClient } from "./useEnvioClient";
import { useQuery, useSubscription } from "@apollo/client/react";

/**
 * Filter events by chain ID (event IDs are formatted as {chainId}_{block}_{logIndex})
 */
const filterByChain = <T extends { id: string }>(events: T[], chainId: number): T[] => {
  const prefix = `${chainId}_`;
  return events.filter(event => event.id.startsWith(prefix));
};

interface PlayerPosition {
  id: string;
  player: string;
  newPosition: number;
  db_write_timestamp: string;
}

interface PlayerPositionsState {
  positions: Record<string, number>; // player address -> position
  latestPositions: PlayerPosition[];
  loading: boolean;
  error: any;
  refetch: () => void;
}

/**
 * Hook untuk mendapatkan semua player positions dari Envio indexer
 * Lebih cepat daripada polling contract
 */
export const usePlayerPositions = (): PlayerPositionsState => {
  const { chainId } = useEnvioClient();
  const [positions, setPositions] = useState<Record<string, number>>({});

  const { data, loading, error, refetch } = useQuery(GET_PLAYER_POSITIONS, {
    pollInterval: 500, // Reduced from 100ms to avoid rate limiting (429 errors)
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network", // Gunakan cache untuk respons instant
  });

  // Real-time subscription untuk player movements
  const { data: subscriptionData } = useSubscription(PLAYER_MOVEMENT_SUBSCRIPTION);

  // Update positions dari query data (filtered by chain)
  useEffect(() => {
    if ((data as any)?.FoodScramble_PlayerMoved) {
      const filtered = filterByChain((data as any).FoodScramble_PlayerMoved as PlayerPosition[], chainId);
      const newPositions: Record<string, number> = {};

      // Ambil position terbaru untuk setiap player
      filtered.forEach(movement => {
        newPositions[movement.player] = movement.newPosition;
      });

      setPositions(newPositions);
    }
  }, [data, chainId]);

  // Update positions dari subscription data (real-time)
  useEffect(() => {
    if ((subscriptionData as any)?.FoodScramble_PlayerMoved) {
      setPositions(prev => {
        const updated = { ...prev };
        (subscriptionData as any).FoodScramble_PlayerMoved.forEach((movement: PlayerPosition) => {
          updated[movement.player] = movement.newPosition;
        });
        return updated;
      });
    }
  }, [subscriptionData]);

  // Filter latest positions by current chain
  const latestPositions = useMemo(() => {
    const allPositions = (data as any)?.FoodScramble_PlayerMoved || [];
    return filterByChain(allPositions as PlayerPosition[], chainId);
  }, [data, chainId]);

  return {
    positions,
    latestPositions,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook untuk mendapatkan position player tertentu
 */
export const usePlayerPosition = (playerAddress?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_PLAYER_POSITION_BY_ADDRESS, {
    variables: { player: playerAddress },
    skip: !playerAddress,
    pollInterval: 1000, // 1 second polling to avoid rate limiting
    fetchPolicy: "cache-and-network",
  });

  const position = (data as any)?.FoodScramble_PlayerMoved?.[0]?.newPosition || 0;

  return {
    position,
    loading,
    error,
    refetch,
  };
};
