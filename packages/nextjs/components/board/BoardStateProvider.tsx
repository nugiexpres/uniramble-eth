import { createContext, useEffect, useState } from "react";
import type { BoardContextType, GameState, PlayerAction, PlayerState, TokenBalance } from "./types";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useGameEvents } from "~~/hooks/envio/useGameEvents";
import { usePlayerPositions } from "~~/hooks/envio/usePlayerPositions";

interface GameStateData {
  gameState: {
    totalPlayers: number;
    totalMoves: number;
    totalIngredientsBought: number;
    lastRollTimestamp: string;
    lastFaucetTimestamp: string;
  };
  playerStates: PlayerState[];
  tokenBalances: TokenBalance[];
  playerActions: PlayerAction[];
}

// Create the context
export const BoardStateContext = createContext<BoardContextType>({
  gameState: {
    players: [],
    tokenBalances: {},
    actions: [],
    stats: {
      totalPlayers: 0,
      totalMoves: 0,
      totalIngredientsBought: 0,
    },
  },
  loading: true,
});

const GAME_STATE_QUERY = gql`
  query GetGameState {
    gameState(id: "GAME") {
      totalPlayers
      totalMoves
      totalIngredientsBought
      lastRollTimestamp
      lastFaucetTimestamp
    }
    playerStates {
      id
      position
      balance
      nftBalance
      lastUpdated
      tbaAddress
    }
    tokenBalances {
      id
      address
      token
      balance
      lastUpdated
    }
    playerActions(orderBy: timestamp, orderDirection: desc, first: 10) {
      id
      player
      actionType
      timestamp
      data
      success
      txHash
    }
  }
`;

interface BoardStateProviderProps {
  children: React.ReactNode;
}

export const BoardStateProvider = ({ children }: BoardStateProviderProps) => {
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    tokenBalances: {},
    actions: [],
    stats: {
      totalPlayers: 0,
      totalMoves: 0,
      totalIngredientsBought: 0,
    },
  });

  const { data, loading, error } = useQuery<GameStateData>(GAME_STATE_QUERY);
  const { latestPositions } = usePlayerPositions();
  // Destructure events when needed
  const {
    /* 
    ingredientPurchases,
    specialBoxMints,
    faucetEvents,
    tbaCreations
  */
  } = useGameEvents();

  useEffect(() => {
    if (data) {
      setGameState({
        players: data.playerStates,
        tokenBalances: data.tokenBalances.reduce<Record<string, TokenBalance>>(
          (acc, tb) => ({
            ...acc,
            [tb.id]: tb,
          }),
          {},
        ),
        actions: data.playerActions,
        stats: {
          totalPlayers: data.gameState.totalPlayers,
          totalMoves: data.gameState.totalMoves,
          totalIngredientsBought: data.gameState.totalIngredientsBought,
        },
      });
    }
  }, [data]);

  useEffect(() => {
    if (latestPositions.length > 0) {
      setGameState(prev => ({
        ...prev,
        players: prev.players.map((p: PlayerState) => {
          const latest = latestPositions.find(pos => pos.player === p.id);
          return latest ? { ...p, position: Number(latest.newPosition) } : p;
        }),
      }));
    }
  }, [latestPositions]);

  const value = {
    gameState,
    loading,
    error: error as Error | undefined,
  };

  return <BoardStateContext.Provider value={value}>{children}</BoardStateContext.Provider>;
};
