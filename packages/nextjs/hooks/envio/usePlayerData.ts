/**
 * usePlayerData Hook
 * High-level hook for fetching player-related data from Envio
 */
import {
  GET_ALL_PLAYERS,
  GET_GAME_STATE,
  GET_PLAYER_ACTIONS,
  GET_PLAYER_STATE,
  GET_TOKEN_BALANCES,
  GET_TOKEN_TRANSFERS,
} from "./queries/playerQueries";
import type {
  AllPlayersResponse,
  GameStateResponse,
  PlayerActionsResponse,
  PlayerStateResponse,
  TokenBalancesResponse,
} from "./types";
import { useEnvioQuery } from "./useEnvioQuery";

/**
 * Get player state by address
 */
export function usePlayerState(address: string | undefined, enabled = true) {
  return useEnvioQuery<PlayerStateResponse>({
    query: GET_PLAYER_STATE,
    variables: { address: address?.toLowerCase() },
    enabled: enabled && !!address,
  });
}

/**
 * Get all players
 */
export function useAllPlayers(limit = 100, offset = 0) {
  return useEnvioQuery<AllPlayersResponse>({
    query: GET_ALL_PLAYERS,
    variables: { limit, offset },
  });
}

/**
 * Get token balances for an address
 */
export function useTokenBalances(address: string | undefined, enabled = true) {
  return useEnvioQuery<TokenBalancesResponse>({
    query: GET_TOKEN_BALANCES,
    variables: { address: address?.toLowerCase() },
    enabled: enabled && !!address,
  });
}

/**
 * Get player action history
 */
export function usePlayerActions(address: string | undefined, limit = 50, enabled = true) {
  return useEnvioQuery<PlayerActionsResponse>({
    query: GET_PLAYER_ACTIONS,
    variables: { player: address?.toLowerCase(), limit },
    enabled: enabled && !!address,
  });
}

/**
 * Get game state
 */
export function useGameState() {
  return useEnvioQuery<GameStateResponse>({
    query: GET_GAME_STATE,
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}

/**
 * Get token transfers for an address
 */
export function useTokenTransfers(address: string | undefined, limit = 50, enabled = true) {
  return useEnvioQuery<any>({
    query: GET_TOKEN_TRANSFERS,
    variables: { address: address?.toLowerCase(), limit },
    enabled: enabled && !!address,
  });
}

/**
 * Combined player data hook (gets all player-related data at once)
 */
export function useCompletePlayerData(address: string | undefined) {
  const playerState = usePlayerState(address);
  const tokenBalances = useTokenBalances(address);
  const playerActions = usePlayerActions(address, 50);
  const tokenTransfers = useTokenTransfers(address, 50);

  return {
    playerState: playerState.data,
    tokenBalances: tokenBalances.data,
    playerActions: playerActions.data,
    tokenTransfers: tokenTransfers.data,
    isLoading: playerState.isLoading || tokenBalances.isLoading || playerActions.isLoading || tokenTransfers.isLoading,
    error: playerState.error || tokenBalances.error || playerActions.error || tokenTransfers.error,
    refetch: () => {
      playerState.refetch();
      tokenBalances.refetch();
      playerActions.refetch();
      tokenTransfers.refetch();
    },
  };
}
